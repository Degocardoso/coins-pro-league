// MODEL — leituras do site público
import { and, asc, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../db";
import { atletas, clubes, estatisticas, noticias, partidas, suspensoes, vinculos } from "../schema";

export const siteRepo = {
  /** Elencos ativos de vários clubes de uma vez, capitães primeiro. */
  async elencos(db: Db, temporadaId: number, clubeIds: number[]) {
    if (!clubeIds.length) return [];
    return db
      .select({
        clubeId: vinculos.clubeId,
        capitao: vinculos.capitao,
        atletaId: atletas.id,
        nome: atletas.nomePersonagem,
        plataforma: atletas.plataforma,
      })
      .from(vinculos)
      .innerJoin(atletas, eq(atletas.id, vinculos.atletaId))
      .where(and(eq(vinculos.temporadaId, temporadaId), inArray(vinculos.clubeId, clubeIds), isNull(vinculos.saidaEm)))
      .orderBy(desc(vinculos.capitao), asc(atletas.nomePersonagem));
  },

  /** Próximo jogo com horário marcado, entre as competições informadas. */
  async proximoJogo(db: Db, competicaoIds: number[], agora: Date) {
    if (!competicaoIds.length) return null;
    const [p] = await db
      .select()
      .from(partidas)
      .where(and(inArray(partidas.competicaoId, competicaoIds), eq(partidas.status, "agendada"), gte(partidas.dataHora, agora)))
      .orderBy(asc(partidas.dataHora))
      .limit(1);
    return p ?? null;
  },

  /** Último resultado lançado (W.O. fica de fora: não é um jogo para destacar). */
  async ultimoResultado(db: Db, competicaoIds: number[]) {
    if (!competicaoIds.length) return null;
    const [p] = await db
      .select()
      .from(partidas)
      .where(and(inArray(partidas.competicaoId, competicaoIds), eq(partidas.status, "finalizada")))
      .orderBy(desc(partidas.atualizadoEm))
      .limit(1);
    return p ?? null;
  },

  /** Atletas que cumprem suspensão em alguma destas partidas, com o clube. */
  async suspensos(db: Db, partidaIds: number[]) {
    if (!partidaIds.length) return [];
    return db
      .select({ partidaId: suspensoes.cumprirPartidaId, atleta: atletas.nomePersonagem, clubeId: estatisticas.clubeId })
      .from(suspensoes)
      .innerJoin(atletas, eq(atletas.id, suspensoes.atletaId))
      .innerJoin(
        estatisticas,
        and(eq(estatisticas.partidaId, suspensoes.origemPartidaId), eq(estatisticas.atletaId, suspensoes.atletaId)),
      )
      .where(inArray(suspensoes.cumprirPartidaId, partidaIds));
  },

  noticiasPublicadas: (db: Db, limite: number) =>
    db.select().from(noticias).where(eq(noticias.publicada, true)).orderBy(desc(noticias.publicadaEm)).limit(limite),

  clubesPorIds: (db: Db, ids: number[]) =>
    ids.length ? db.select().from(clubes).where(inArray(clubes.id, ids)).orderBy(asc(clubes.nome)) : Promise.resolve([]),
};

export const jornalRepo = {
  publicadas: (db: Db, limite: number, deslocamento: number) =>
    db
      .select()
      .from(noticias)
      .where(eq(noticias.publicada, true))
      .orderBy(desc(noticias.publicadaEm), desc(noticias.id))
      .limit(limite)
      .offset(deslocamento),
  async contarPublicadas(db: Db) {
    const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(noticias).where(eq(noticias.publicada, true));
    return r.n;
  },
  async publicada(db: Db, id: number) {
    const [n] = await db.select().from(noticias).where(and(eq(noticias.id, id), eq(noticias.publicada, true)));
    return n ?? null;
  },
  outras: (db: Db, id: number, limite: number) =>
    db
      .select()
      .from(noticias)
      .where(and(eq(noticias.publicada, true), ne(noticias.id, id)))
      .orderBy(desc(noticias.publicadaEm), desc(noticias.id))
      .limit(limite),
};
