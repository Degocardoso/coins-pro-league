// CONTROLLER — partidas: agendar, lançar resultado com estatísticas e aplicar W.O.
import type { Db } from "@/models/db";
import {
  competicoesRepo,
  elencoRepo,
  estatisticasRepo,
  nomesRepo,
  partidasRepo,
  suspensoesRepo,
  type Partida,
} from "@/models/repositories";
import { gerarSuspensoes, validarResultado, type EstatisticaLancada } from "./regras/resultado";
import { vencedorDaPartida } from "./regras/copa";
import type { TipoWo } from "./regras/classificacao";

export type DadosResultado = {
  golsMandante: number;
  golsVisitante: number;
  prorrogacao?: boolean;
  penaltisMandante?: number | null;
  penaltisVisitante?: number | null;
  estatisticas: EstatisticaLancada[];
};

export type RespostaResultado = { ok: true; alertas: string[] } | { ok: false; erros: string[] };

export class PartidaController {
  constructor(private db: Db) {}

  async agendar(partidaId: number, dataHora: Date | null) {
    const p = await partidasRepo.buscar(this.db, partidaId);
    if (!p) throw new Error("Partida não encontrada");
    if (p.status === "finalizada" || p.status === "wo") throw new Error("Partida já encerrada");
    await partidasRepo.atualizar(this.db, partidaId, {
      dataHora,
      status: dataHora ? "agendada" : "a_agendar",
    });
  }

  async lancarResultado(partidaId: number, dados: DadosResultado): Promise<RespostaResultado> {
    return this.db.transaction(async (tx) => {
      const p = await partidasRepo.buscar(tx, partidaId);
      if (!p) return { ok: false, erros: ["Partida não encontrada"] };
      if (!p.mandanteId || !p.visitanteId) return { ok: false, erros: ["Os dois clubes ainda não estão definidos"] };
      const comp = await competicoesRepo.buscar(tx, p.competicaoId);
      if (!comp) return { ok: false, erros: ["Competição não encontrada"] };

      const dataDoJogo = p.dataHora ?? new Date();
      const [elencoMandante, elencoVisitante, suspensos, nomes] = await Promise.all([
        elencoRepo.naData(tx, comp.temporadaId, p.mandanteId, dataDoJogo),
        elencoRepo.naData(tx, comp.temporadaId, p.visitanteId, dataDoJogo),
        suspensoesRepo.suspensosNaPartida(tx, p.id),
        nomesRepo.atletas(tx, dados.estatisticas.map((e) => e.atletaId)),
      ]);

      const resultado = {
        tipoCompeticao: comp.tipo,
        mandanteId: p.mandanteId,
        visitanteId: p.visitanteId,
        golsMandante: dados.golsMandante,
        golsVisitante: dados.golsVisitante,
        prorrogacao: dados.prorrogacao ?? false,
        penaltisMandante: dados.penaltisMandante ?? null,
        penaltisVisitante: dados.penaltisVisitante ?? null,
        estatisticas: dados.estatisticas,
      };
      const { erros, alertas } = validarResultado(resultado, {
        elencoMandante,
        elencoVisitante,
        suspensosNestaPartida: suspensos,
        nomeAtleta: (id) => nomes.get(id) ?? `Atleta #${id}`,
      });
      if (erros.length) return { ok: false, erros };

      const errosCopa = await this.conferirSequenciaDaCopa(tx, p, comp.tipo, {
        ...resultado,
        wo: null,
      });
      if (errosCopa.length) return { ok: false, erros: errosCopa };

      await partidasRepo.atualizar(tx, p.id, {
        status: "finalizada",
        wo: null,
        golsMandante: resultado.golsMandante,
        golsVisitante: resultado.golsVisitante,
        prorrogacao: resultado.prorrogacao,
        penaltisMandante: resultado.penaltisMandante,
        penaltisVisitante: resultado.penaltisVisitante,
      });
      await estatisticasRepo.substituirDaPartida(
        tx,
        p.id,
        dados.estatisticas.map((e) => ({ ...e, partidaId: p.id })),
      );

      if (comp.tipo === "copa") await this.avancarVencedor(tx, p.id, vencedorDaPartida({ ...resultado, wo: null }));

      // Depois de avançar o vencedor, a próxima partida da copa já existe com o clube
      const proximas = new Map<number, number | null>();
      for (const clubeId of [p.mandanteId, p.visitanteId])
        proximas.set(clubeId, await partidasRepo.proximaDoClube(tx, p, clubeId));
      await suspensoesRepo.substituirDaOrigem(
        tx,
        p.id,
        comp.id,
        gerarSuspensoes(dados.estatisticas, (clubeId) => proximas.get(clubeId) ?? null),
      );

      return { ok: true, alertas };
    });
  }

  /** W.O. vale 3x0 e não gera estatística individual. */
  async aplicarWO(partidaId: number, tipo: TipoWo): Promise<RespostaResultado> {
    return this.db.transaction(async (tx) => {
      const p = await partidasRepo.buscar(tx, partidaId);
      if (!p) return { ok: false, erros: ["Partida não encontrada"] };
      if (!p.mandanteId || !p.visitanteId) return { ok: false, erros: ["Os dois clubes ainda não estão definidos"] };
      const comp = await competicoesRepo.buscar(tx, p.competicaoId);
      if (!comp) return { ok: false, erros: ["Competição não encontrada"] };

      const gols =
        tipo === "mandante_vence" ? [3, 0] : tipo === "visitante_vence" ? [0, 3] : [0, 0];
      const resultado = {
        mandanteId: p.mandanteId,
        visitanteId: p.visitanteId,
        golsMandante: gols[0],
        golsVisitante: gols[1],
        penaltisMandante: null,
        penaltisVisitante: null,
        wo: tipo,
      };

      const errosCopa = await this.conferirSequenciaDaCopa(tx, p, comp.tipo, resultado);
      if (errosCopa.length) return { ok: false, erros: errosCopa };

      await partidasRepo.atualizar(tx, p.id, {
        status: "wo",
        wo: tipo,
        golsMandante: gols[0],
        golsVisitante: gols[1],
        prorrogacao: false,
        penaltisMandante: null,
        penaltisVisitante: null,
      });
      await estatisticasRepo.substituirDaPartida(tx, p.id, []);
      await suspensoesRepo.substituirDaOrigem(tx, p.id, comp.id, []);
      if (comp.tipo === "copa") await this.avancarVencedor(tx, p.id, vencedorDaPartida(resultado));

      const alertas =
        tipo === "duplo" && comp.tipo === "copa"
          ? ["W.O. duplo na copa: ninguém avança. A organização decide a vaga na próxima fase."]
          : [];
      return { ok: true, alertas };
    });
  }

  // Se mudar o vencedor de uma partida cuja seguinte já foi jogada, a chave quebraria
  private async conferirSequenciaDaCopa(
    tx: Db,
    p: Partida,
    tipo: "liga" | "copa",
    novo: Parameters<typeof vencedorDaPartida>[0],
  ): Promise<string[]> {
    if (tipo !== "copa") return [];
    const encerrada = p.status === "finalizada" || p.status === "wo";
    const vencedorAntigo =
      encerrada && p.mandanteId && p.visitanteId
        ? vencedorDaPartida({ ...p, mandanteId: p.mandanteId, visitanteId: p.visitanteId })
        : null;
    const vencedorNovo = vencedorDaPartida(novo);
    if (vencedorAntigo === null || vencedorAntigo === vencedorNovo) return [];
    const dependentes = await partidasRepo.dependentes(tx, p.id);
    const jaJogada = dependentes.some((d) => d.status === "finalizada" || d.status === "wo");
    return jaJogada
      ? ["Essa correção muda quem avançou, mas a partida seguinte já foi jogada. Corrija a fase seguinte antes."]
      : [];
  }

  private async avancarVencedor(tx: Db, partidaId: number, vencedor: number | null) {
    for (const d of await partidasRepo.dependentes(tx, partidaId)) {
      if (d.origemMandanteId === partidaId) await partidasRepo.atualizar(tx, d.id, { mandanteId: vencedor });
      if (d.origemVisitanteId === partidaId) await partidasRepo.atualizar(tx, d.id, { visitanteId: vencedor });
    }
  }
}
