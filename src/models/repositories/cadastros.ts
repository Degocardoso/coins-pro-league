// MODEL — consultas dos cadastros usados pelo painel admin
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import type { Db } from "../db";
import {
  admins,
  arquivos,
  atletas,
  clubes,
  competicoes,
  estatisticas,
  inscricoes,
  noticias,
  paginas,
  partidas,
  rodadas,
  temporadas,
  vinculos,
} from "../schema";

export const temporadasRepo = {
  listar: (db: Db) => db.select().from(temporadas).orderBy(desc(temporadas.numero)),
  async ativa(db: Db) {
    const [t] = await db.select().from(temporadas).where(eq(temporadas.ativa, true));
    return t ?? null;
  },
  async criar(db: Db, dados: typeof temporadas.$inferInsert) {
    const [t] = await db.insert(temporadas).values(dados).returning();
    return t;
  },
  async atualizar(db: Db, id: number, dados: Partial<typeof temporadas.$inferInsert>) {
    await db.update(temporadas).set(dados).where(eq(temporadas.id, id));
  },
  async ativar(db: Db, id: number) {
    await db.update(temporadas).set({ ativa: false }).where(ne(temporadas.id, id));
    await db.update(temporadas).set({ ativa: true }).where(eq(temporadas.id, id));
  },
  /** A temporada começou quando alguma competição dela já está em andamento ou encerrada. */
  async jaComecou(db: Db, temporadaId: number) {
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(competicoes)
      .where(
        and(
          eq(competicoes.temporadaId, temporadaId),
          inArray(competicoes.status, ["em_andamento", "encerrada"]),
        ),
      );
    return r.n > 0;
  },
};

export const competicoesAdminRepo = {
  listar: (db: Db, temporadaId: number) =>
    db.select().from(competicoes).where(eq(competicoes.temporadaId, temporadaId)).orderBy(asc(competicoes.id)),
  async criar(db: Db, dados: typeof competicoes.$inferInsert) {
    const [c] = await db.insert(competicoes).values(dados).returning();
    return c;
  },
  async atualizar(db: Db, id: number, dados: Partial<typeof competicoes.$inferInsert>) {
    await db.update(competicoes).set(dados).where(eq(competicoes.id, id));
  },
  inscricoesComClubes: (db: Db, competicaoId: number) =>
    db
      .select({ inscricao: inscricoes, clube: clubes })
      .from(inscricoes)
      .innerJoin(clubes, eq(clubes.id, inscricoes.clubeId))
      .where(eq(inscricoes.competicaoId, competicaoId))
      .orderBy(asc(inscricoes.criadoEm), asc(inscricoes.id)),
  async inscrever(db: Db, competicaoId: number, clubeId: number) {
    await db.insert(inscricoes).values({ competicaoId, clubeId }).onConflictDoNothing();
  },
  async removerInscricao(db: Db, inscricaoId: number) {
    await db.delete(inscricoes).where(eq(inscricoes.id, inscricaoId));
  },
  /** Jogadas e total de partidas por competição, para o painel. */
  async progresso(db: Db, competicaoIds: number[]) {
    if (!competicaoIds.length) return new Map<number, { jogadas: number; total: number }>();
    const linhas = await db
      .select({
        competicaoId: partidas.competicaoId,
        total: sql<number>`count(*)::int`,
        jogadas: sql<number>`count(*) filter (where ${partidas.status} in ('finalizada','wo'))::int`,
      })
      .from(partidas)
      .where(inArray(partidas.competicaoId, competicaoIds))
      .groupBy(partidas.competicaoId);
    return new Map(linhas.map((l) => [l.competicaoId, { jogadas: l.jogadas, total: l.total }]));
  },
  async pendentes(db: Db, competicaoIds: number[]) {
    if (!competicaoIds.length) return 0;
    const [r] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(inscricoes)
      .where(and(inArray(inscricoes.competicaoId, competicaoIds), eq(inscricoes.status, "pendente")));
    return r.n;
  },
};

export const rodadasRepo = {
  daCompeticao: (db: Db, competicaoId: number) =>
    db.select().from(rodadas).where(eq(rodadas.competicaoId, competicaoId)).orderBy(asc(rodadas.numero)),
  async definirPrazo(db: Db, rodadaId: number, prazo: Date | null) {
    await db.update(rodadas).set({ prazo }).where(eq(rodadas.id, rodadaId));
  },
  async partidas(db: Db, rodadaId: number) {
    return db.select().from(partidas).where(eq(partidas.rodadaId, rodadaId)).orderBy(asc(partidas.ordem));
  },
  async buscar(db: Db, id: number) {
    const [r] = await db.select().from(rodadas).where(eq(rodadas.id, id));
    return r ?? null;
  },
};

export const clubesRepo = {
  listar: (db: Db) => db.select().from(clubes).orderBy(asc(clubes.nome)),
  async buscar(db: Db, id: number) {
    const [c] = await db.select().from(clubes).where(eq(clubes.id, id));
    return c ?? null;
  },
  async criar(db: Db, dados: typeof clubes.$inferInsert) {
    const [c] = await db.insert(clubes).values(dados).returning();
    return c;
  },
  async atualizar(db: Db, id: number, dados: Partial<typeof clubes.$inferInsert>) {
    await db.update(clubes).set(dados).where(eq(clubes.id, id));
  },
  async porNome(db: Db, nome: string) {
    const [c] = await db
      .select()
      .from(clubes)
      .where(sql`lower(${clubes.nome}) = lower(${nome})`);
    return c ?? null;
  },
  /** Tamanho do elenco ativo de cada clube na temporada. */
  async tamanhosDosElencos(db: Db, temporadaId: number) {
    const linhas = await db
      .select({ clubeId: vinculos.clubeId, n: sql<number>`count(*)::int` })
      .from(vinculos)
      .where(and(eq(vinculos.temporadaId, temporadaId), isNull(vinculos.saidaEm)))
      .groupBy(vinculos.clubeId);
    return new Map(linhas.map((l) => [l.clubeId, l.n]));
  },
};

export const atletasRepo = {
  async porNome(db: Db, nomePersonagem: string) {
    const [a] = await db
      .select()
      .from(atletas)
      .where(sql`lower(${atletas.nomePersonagem}) = lower(${nomePersonagem})`);
    return a ?? null;
  },
  async criar(db: Db, dados: typeof atletas.$inferInsert) {
    const [a] = await db.insert(atletas).values(dados).returning();
    return a;
  },
  async atualizar(db: Db, id: number, dados: Partial<typeof atletas.$inferInsert>) {
    await db.update(atletas).set(dados).where(eq(atletas.id, id));
  },
  /** Elenco ativo do clube com os dados de cada atleta. */
  elencoAtivo: (db: Db, temporadaId: number, clubeId: number) =>
    db
      .select({ vinculo: vinculos, atleta: atletas })
      .from(vinculos)
      .innerJoin(atletas, eq(atletas.id, vinculos.atletaId))
      .where(and(eq(vinculos.temporadaId, temporadaId), eq(vinculos.clubeId, clubeId), isNull(vinculos.saidaEm)))
      .orderBy(desc(vinculos.capitao), asc(atletas.nomePersonagem)),
  async porIds(db: Db, ids: number[]) {
    if (!ids.length) return [];
    return db.select().from(atletas).where(inArray(atletas.id, ids)).orderBy(asc(atletas.nomePersonagem));
  },
};

export const vinculosRepo = {
  async buscar(db: Db, id: number) {
    const [v] = await db.select().from(vinculos).where(eq(vinculos.id, id));
    return v ?? null;
  },
  async definirCapitao(db: Db, id: number, capitao: boolean) {
    await db.update(vinculos).set({ capitao }).where(eq(vinculos.id, id));
  },
};

export const estatisticasAdminRepo = {
  daPartida: (db: Db, partidaId: number) => db.select().from(estatisticas).where(eq(estatisticas.partidaId, partidaId)),
};

export const noticiasRepo = {
  listar: (db: Db) => db.select().from(noticias).orderBy(desc(noticias.publicadaEm)),
  async buscar(db: Db, id: number) {
    const [n] = await db.select().from(noticias).where(eq(noticias.id, id));
    return n ?? null;
  },
  async criar(db: Db, dados: typeof noticias.$inferInsert) {
    const [n] = await db.insert(noticias).values(dados).returning();
    return n;
  },
  async atualizar(db: Db, id: number, dados: Partial<typeof noticias.$inferInsert>) {
    await db.update(noticias).set(dados).where(eq(noticias.id, id));
  },
  async excluir(db: Db, id: number) {
    await db.delete(noticias).where(eq(noticias.id, id));
  },
};

export const paginasRepo = {
  async buscar(db: Db, slug: string) {
    const [p] = await db.select().from(paginas).where(eq(paginas.slug, slug));
    return p ?? null;
  },
  async salvar(db: Db, slug: string, titulo: string, conteudo: string) {
    await db
      .insert(paginas)
      .values({ slug, titulo, conteudo })
      .onConflictDoUpdate({ target: paginas.slug, set: { titulo, conteudo, atualizadoEm: new Date() } });
  },
};

export const arquivosRepo = {
  async salvar(db: Db, dados: { nome: string; mime: string; bytes: Buffer }) {
    const [a] = await db
      .insert(arquivos)
      .values({ ...dados, tamanho: dados.bytes.length })
      .returning({ id: arquivos.id });
    return a.id;
  },
  async buscar(db: Db, id: string) {
    const [a] = await db.select().from(arquivos).where(eq(arquivos.id, id));
    return a ?? null;
  },
};

export const adminsRepo = {
  async porEmail(db: Db, email: string) {
    const [a] = await db.select().from(admins).where(eq(admins.email, email.trim().toLowerCase()));
    return a ?? null;
  },
  async porId(db: Db, id: number) {
    const [a] = await db.select().from(admins).where(eq(admins.id, id));
    return a ?? null;
  },
  async criar(db: Db, dados: typeof admins.$inferInsert) {
    const [a] = await db
      .insert(admins)
      .values({ ...dados, email: dados.email.trim().toLowerCase() })
      .returning();
    return a;
  },
};
