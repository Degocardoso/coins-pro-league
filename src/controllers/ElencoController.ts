// CONTROLLER — elenco: entrada e saída de atletas, respeitando a janela
import type { Db } from "@/models/db";
import { competicoesRepo, elencoRepo } from "@/models/repositories";
import { validarEntrada, validarSaida, type ContextoMudancaElenco } from "./regras/elenco";

export type RespostaElenco = { ok: true } | { ok: false; erros: string[] };

export class ElencoController {
  constructor(private db: Db) {}

  private async contexto(tx: Db, temporadaId: number, clubeId: number, agora: Date, antesDoInicio: boolean) {
    const temporada = await competicoesRepo.temporada(tx, temporadaId);
    if (!temporada) throw new Error("Temporada não encontrada");
    const ativos = await elencoRepo.ativos(tx, temporadaId, clubeId);
    const ctx: ContextoMudancaElenco = {
      agora,
      antesDoInicio,
      janela: { inicio: temporada.janelaInicio, fim: temporada.janelaFim },
      qtdElencoAtual: ativos.length,
    };
    return { ctx, ativos };
  }

  /** antesDoInicio = true durante a inscrição, quando o elenco ainda pode ser montado livremente. */
  async adicionar(
    temporadaId: number,
    clubeId: number,
    atletaId: number,
    opcoes: { agora?: Date; antesDoInicio?: boolean; capitao?: boolean } = {},
  ): Promise<RespostaElenco> {
    const agora = opcoes.agora ?? new Date();
    return this.db.transaction(async (tx) => {
      const { ctx } = await this.contexto(tx, temporadaId, clubeId, agora, opcoes.antesDoInicio ?? false);
      const jaTemClube = !!(await elencoRepo.vinculoAtivoDoAtleta(tx, temporadaId, atletaId));
      const erros = validarEntrada(ctx, jaTemClube);
      if (erros.length) return { ok: false, erros };
      await elencoRepo.criar(tx, { temporadaId, clubeId, atletaId, capitao: opcoes.capitao ?? false, entradaEm: agora });
      return { ok: true };
    });
  }

  async remover(
    temporadaId: number,
    clubeId: number,
    atletaId: number,
    opcoes: { agora?: Date; antesDoInicio?: boolean } = {},
  ): Promise<RespostaElenco> {
    const agora = opcoes.agora ?? new Date();
    return this.db.transaction(async (tx) => {
      const { ctx, ativos } = await this.contexto(tx, temporadaId, clubeId, agora, opcoes.antesDoInicio ?? false);
      const vinculo = ativos.find((v) => v.atletaId === atletaId);
      if (!vinculo) return { ok: false, erros: ["Esse atleta não está no elenco do clube."] };
      const erros = validarSaida(ctx);
      if (erros.length) return { ok: false, erros };
      await elencoRepo.encerrar(tx, vinculo.id, agora);
      return { ok: true };
    });
  }
}
