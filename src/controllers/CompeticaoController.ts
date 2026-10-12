// CONTROLLER — competições: gerar tabela da liga, chave da copa e confirmar inscrições
import type { Db } from "@/models/db";
import { competicoesRepo, partidasRepo } from "@/models/repositories";
import { gerarTurnoEReturno } from "./regras/tabela";
import { gerarChave } from "./regras/copa";
import { statusAoConfirmar } from "./regras/elenco";

export class CompeticaoController {
  constructor(private db: Db) {}

  /** Cria as 30 rodadas (16 clubes) a partir das inscrições confirmadas. */
  async gerarTabelaLiga(competicaoId: number) {
    return this.db.transaction(async (tx) => {
      const comp = await competicoesRepo.buscar(tx, competicaoId);
      if (!comp) throw new Error("Competição não encontrada");
      if (comp.tipo !== "liga") throw new Error("Essa competição não é uma liga");
      if (await partidasRepo.existemNaCompeticao(tx, competicaoId))
        throw new Error("A tabela já foi gerada para esta competição");

      const clubeIds = await competicoesRepo.clubesConfirmados(tx, competicaoId);
      const geradas = gerarTurnoEReturno(clubeIds);

      // Dois inserts no total: todas as rodadas, depois todas as partidas
      const criadas = await partidasRepo.criarRodadas(
        tx,
        geradas.map((r) => ({ competicaoId, numero: r.numero, nome: `Rodada ${r.numero}` })),
      );
      const idDaRodada = new Map(criadas.map((r) => [r.numero, r.id]));
      await partidasRepo.criarPartidas(
        tx,
        geradas.flatMap((r) =>
          r.confrontos.map((c, i) => ({
            competicaoId,
            rodadaId: idDaRodada.get(r.numero)!,
            ordem: i + 1,
            mandanteId: c.mandante,
            visitanteId: c.visitante,
          })),
        ),
      );
      return { rodadas: geradas.length, partidas: geradas.reduce((s, r) => s + r.confrontos.length, 0) };
    });
  }

  /**
   * Cria a chave da copa. ordemClubes = ordem do sorteio; sem ela, usa a ordem
   * das inscrições confirmadas.
   */
  async gerarChaveCopa(competicaoId: number, ordemClubes?: number[]) {
    return this.db.transaction(async (tx) => {
      const comp = await competicoesRepo.buscar(tx, competicaoId);
      if (!comp) throw new Error("Competição não encontrada");
      if (comp.tipo !== "copa") throw new Error("Essa competição não é uma copa");
      if (await partidasRepo.existemNaCompeticao(tx, competicaoId))
        throw new Error("A chave já foi gerada para esta copa");

      const confirmados = await competicoesRepo.clubesConfirmados(tx, competicaoId);
      const ordem = ordemClubes ?? confirmados;
      const fora = ordem.filter((id) => !confirmados.includes(id));
      if (fora.length || ordem.length !== confirmados.length)
        throw new Error("A ordem do sorteio precisa ter exatamente os clubes confirmados");

      const fases = gerarChave(ordem);
      const idPorPosicao = new Map<string, number>();

      for (const fase of fases) {
        const rodada = await partidasRepo.criarRodada(tx, competicaoId, fase.numero, fase.nome);
        for (const p of fase.partidas) {
          const lado = (v: typeof p.mandante) =>
            "clubeId" in v
              ? { clube: v.clubeId, origem: null }
              : { clube: null, origem: idPorPosicao.get(`${v.vencedorDe.fase}-${v.vencedorDe.ordem}`)! };
          const m = lado(p.mandante);
          const v = lado(p.visitante);
          const criada = await partidasRepo.criarPartida(tx, {
            competicaoId,
            rodadaId: rodada.id,
            ordem: p.ordem,
            mandanteId: m.clube,
            visitanteId: v.clube,
            origemMandanteId: m.origem,
            origemVisitanteId: v.origem,
          });
          idPorPosicao.set(`${p.fase}-${p.ordem}`, criada.id);
        }
      }
      return { fases: fases.map((f) => ({ nome: f.nome, partidas: f.partidas.length })) };
    });
  }

  /** Confirma a inscrição se houver vaga; senão, coloca na lista de espera. */
  async confirmarInscricao(inscricaoId: number) {
    return this.db.transaction(async (tx) => {
      const insc = await competicoesRepo.buscarInscricao(tx, inscricaoId);
      if (!insc) throw new Error("Inscrição não encontrada");
      const comp = await competicoesRepo.buscar(tx, insc.competicaoId);
      if (!comp) throw new Error("Competição não encontrada");
      if (comp.taxaCentavos && !insc.pago) throw new Error("Inscrição com taxa: marque o pagamento antes de confirmar");
      const confirmadas = await competicoesRepo.contarConfirmadas(tx, comp.id);
      const status = statusAoConfirmar(confirmadas, comp.maxClubes);
      await competicoesRepo.atualizarInscricao(tx, inscricaoId, { status });
      return status;
    });
  }
}
