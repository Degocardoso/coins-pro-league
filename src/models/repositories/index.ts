// MODEL — consultas ao banco usadas pelos controllers
import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import type { Db } from "../db";
import {
  atletas,
  clubes,
  competicoes,
  estatisticas,
  inscricoes,
  partidas,
  rodadas,
  suspensoes,
  temporadas,
  vinculos,
} from "../schema";

export type Partida = typeof partidas.$inferSelect;
export type Competicao = typeof competicoes.$inferSelect;
export type NovaEstatistica = typeof estatisticas.$inferInsert;

export const competicoesRepo = {
  async buscar(db: Db, id: number) {
    const [c] = await db.select().from(competicoes).where(eq(competicoes.id, id));
    return c ?? null;
  },
  async temporada(db: Db, id: number) {
    const [t] = await db.select().from(temporadas).where(eq(temporadas.id, id));
    return t ?? null;
  },
  async clubesConfirmados(db: Db, competicaoId: number): Promise<number[]> {
    const linhas = await db
      .select({ clubeId: inscricoes.clubeId })
      .from(inscricoes)
      .where(and(eq(inscricoes.competicaoId, competicaoId), eq(inscricoes.status, "confirmada")))
      .orderBy(asc(inscricoes.criadoEm), asc(inscricoes.id));
    return linhas.map((l) => l.clubeId);
  },
  async contarConfirmadas(db: Db, competicaoId: number) {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(inscricoes)
      .where(and(eq(inscricoes.competicaoId, competicaoId), eq(inscricoes.status, "confirmada")));
    return r.n;
  },
  async buscarInscricao(db: Db, id: number) {
    const [i] = await db.select().from(inscricoes).where(eq(inscricoes.id, id));
    return i ?? null;
  },
  async atualizarInscricao(db: Db, id: number, dados: Partial<typeof inscricoes.$inferInsert>) {
    await db.update(inscricoes).set(dados).where(eq(inscricoes.id, id));
  },
};

export const partidasRepo = {
  async buscar(db: Db, id: number) {
    const [p] = await db.select().from(partidas).where(eq(partidas.id, id));
    return p ?? null;
  },
  async existemNaCompeticao(db: Db, competicaoId: number) {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(partidas)
      .where(eq(partidas.competicaoId, competicaoId));
    return r.n > 0;
  },
  async criarRodada(db: Db, competicaoId: number, numero: number, nome: string) {
    const [r] = await db.insert(rodadas).values({ competicaoId, numero, nome }).returning();
    return r;
  },
  async criarRodadas(db: Db, lista: (typeof rodadas.$inferInsert)[]) {
    return db.insert(rodadas).values(lista).returning();
  },
  async criarPartidas(db: Db, lista: (typeof partidas.$inferInsert)[]) {
    if (lista.length) await db.insert(partidas).values(lista);
  },
  async criarPartida(db: Db, dados: typeof partidas.$inferInsert) {
    const [p] = await db.insert(partidas).values(dados).returning();
    return p;
  },
  async atualizar(db: Db, id: number, dados: Partial<typeof partidas.$inferInsert>) {
    await db
      .update(partidas)
      .set({ ...dados, atualizadoEm: new Date() })
      .where(eq(partidas.id, id));
  },
  /** Partidas da competição com o número da rodada, na ordem da tabela. */
  async daCompeticao(db: Db, competicaoId: number) {
    return db
      .select({ partida: partidas, rodadaNumero: rodadas.numero, rodadaNome: rodadas.nome })
      .from(partidas)
      .innerJoin(rodadas, eq(rodadas.id, partidas.rodadaId))
      .where(eq(partidas.competicaoId, competicaoId))
      .orderBy(asc(rodadas.numero), asc(partidas.ordem));
  },
  /** Próxima partida do clube na mesma competição, depois da partida informada. */
  async proximaDoClube(db: Db, partida: Partida, clubeId: number): Promise<number | null> {
    const todas = await this.daCompeticao(db, partida.competicaoId);
    const idx = todas.findIndex((t) => t.partida.id === partida.id);
    const seguinte = todas
      .slice(idx + 1)
      .find((t) => t.partida.mandanteId === clubeId || t.partida.visitanteId === clubeId);
    return seguinte?.partida.id ?? null;
  },
  /** Partidas da copa que recebem o vencedor desta. */
  async dependentes(db: Db, partidaId: number) {
    return db
      .select()
      .from(partidas)
      .where(or(eq(partidas.origemMandanteId, partidaId), eq(partidas.origemVisitanteId, partidaId)));
  },
};

export const elencoRepo = {
  /** Atletas no elenco do clube numa data (respeita entradas e saídas da janela). */
  async naData(db: Db, temporadaId: number, clubeId: number, data: Date): Promise<Set<number>> {
    const linhas = await db
      .select({ atletaId: vinculos.atletaId })
      .from(vinculos)
      .where(
        and(
          eq(vinculos.temporadaId, temporadaId),
          eq(vinculos.clubeId, clubeId),
          lte(vinculos.entradaEm, data),
          or(isNull(vinculos.saidaEm), gt(vinculos.saidaEm, data)),
        ),
      );
    return new Set(linhas.map((l) => l.atletaId));
  },
  async ativos(db: Db, temporadaId: number, clubeId: number) {
    return db
      .select()
      .from(vinculos)
      .where(and(eq(vinculos.temporadaId, temporadaId), eq(vinculos.clubeId, clubeId), isNull(vinculos.saidaEm)));
  },
  async vinculoAtivoDoAtleta(db: Db, temporadaId: number, atletaId: number) {
    const [v] = await db
      .select()
      .from(vinculos)
      .where(and(eq(vinculos.temporadaId, temporadaId), eq(vinculos.atletaId, atletaId), isNull(vinculos.saidaEm)));
    return v ?? null;
  },
  async criar(db: Db, dados: typeof vinculos.$inferInsert) {
    const [v] = await db.insert(vinculos).values(dados).returning();
    return v;
  },
  async encerrar(db: Db, vinculoId: number, quando: Date) {
    await db.update(vinculos).set({ saidaEm: quando, capitao: false }).where(eq(vinculos.id, vinculoId));
  },
};

export const estatisticasRepo = {
  async substituirDaPartida(db: Db, partidaId: number, linhas: NovaEstatistica[]) {
    await db.delete(estatisticas).where(eq(estatisticas.partidaId, partidaId));
    if (linhas.length) await db.insert(estatisticas).values(linhas);
  },
  /** Linhas para os rankings: só partidas jogadas (W.O. fica de fora). */
  async paraRanking(db: Db, competicaoId: number) {
    return db
      .select({ e: estatisticas, p: partidas })
      .from(estatisticas)
      .innerJoin(partidas, eq(partidas.id, estatisticas.partidaId))
      .where(and(eq(partidas.competicaoId, competicaoId), eq(partidas.status, "finalizada")));
  },
};

export const suspensoesRepo = {
  async substituirDaOrigem(
    db: Db,
    origemPartidaId: number,
    competicaoId: number,
    lista: { atletaId: number; cumprirPartidaId: number | null }[],
  ) {
    await db.delete(suspensoes).where(eq(suspensoes.origemPartidaId, origemPartidaId));
    if (lista.length)
      await db.insert(suspensoes).values(lista.map((s) => ({ ...s, origemPartidaId, competicaoId })));
  },
  async suspensosNaPartida(db: Db, partidaId: number): Promise<Set<number>> {
    const linhas = await db
      .select({ atletaId: suspensoes.atletaId })
      .from(suspensoes)
      .where(eq(suspensoes.cumprirPartidaId, partidaId));
    return new Set(linhas.map((l) => l.atletaId));
  },
};

export const nomesRepo = {
  async atletas(db: Db, ids: number[]) {
    if (!ids.length) return new Map<number, string>();
    const linhas = await db
      .select({ id: atletas.id, nome: atletas.nomePersonagem })
      .from(atletas)
      .where(inArray(atletas.id, ids));
    return new Map(linhas.map((l) => [l.id, l.nome]));
  },
  async clubes(db: Db, ids: number[]) {
    if (!ids.length) return new Map<number, { nome: string; escudoUrl: string | null }>();
    const linhas = await db
      .select({ id: clubes.id, nome: clubes.nome, escudoUrl: clubes.escudoUrl })
      .from(clubes)
      .where(inArray(clubes.id, ids));
    return new Map(linhas.map((l) => [l.id, { nome: l.nome, escudoUrl: l.escudoUrl }]));
  },
};
