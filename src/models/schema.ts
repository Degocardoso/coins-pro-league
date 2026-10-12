// MODEL — estrutura do banco da Coin's Pro League (Drizzle + PostgreSQL)
import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const agora = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const data = () => timestamp({ withTimezone: true });

export const plataformaEnum = pgEnum("plataforma", ["ps5", "xbox", "pc"]);
export const tipoCompeticaoEnum = pgEnum("tipo_competicao", ["liga", "copa"]);
export const statusCompeticaoEnum = pgEnum("status_competicao", [
  "rascunho",
  "inscricoes",
  "em_andamento",
  "encerrada",
]);
export const statusInscricaoEnum = pgEnum("status_inscricao", [
  "pendente",
  "confirmada",
  "espera",
  "recusada",
]);
export const statusPartidaEnum = pgEnum("status_partida", [
  "a_agendar",
  "agendada",
  "finalizada",
  "wo",
]);
export const tipoWoEnum = pgEnum("tipo_wo", ["mandante_vence", "visitante_vence", "duplo"]);
export const papelAdminEnum = pgEnum("papel_admin", ["admin", "moderador"]);

// Temporada: agrupa competições e define a janela de transferências
export const temporadas = pgTable("temporadas", {
  id: serial().primaryKey(),
  numero: integer().notNull().unique(),
  nome: varchar({ length: 60 }).notNull(),
  ativa: boolean().notNull().default(false),
  janelaInicio: data(),
  janelaFim: data(),
  criadoEm: agora(),
});

export const clubes = pgTable("clubes", {
  id: serial().primaryKey(),
  nome: varchar({ length: 60 }).notNull().unique(),
  slug: varchar({ length: 80 }).notNull().unique(),
  escudoUrl: text(),
  criadoEm: agora(),
});

export const atletas = pgTable(
  "atletas",
  {
    id: serial().primaryKey(),
    nomePersonagem: varchar({ length: 40 }).notNull().unique(),
    plataforma: plataformaEnum().notNull(),
    idPlataforma: varchar({ length: 60 }).notNull(),
    twitch: varchar({ length: 40 }),
    criadoEm: agora(),
  },
  (t) => [uniqueIndex("atleta_plataforma_unico").on(t.plataforma, t.idPlataforma)],
);

// Elenco: vínculo atleta x clube dentro de uma temporada.
// saidaEm nulo = vínculo ativo. Um atleta só tem UM vínculo ativo por temporada.
export const vinculos = pgTable(
  "vinculos",
  {
    id: serial().primaryKey(),
    temporadaId: integer().notNull().references(() => temporadas.id),
    clubeId: integer().notNull().references(() => clubes.id),
    atletaId: integer().notNull().references(() => atletas.id),
    capitao: boolean().notNull().default(false),
    entradaEm: agora(),
    saidaEm: data(),
  },
  (t) => [
    uniqueIndex("vinculo_ativo_unico")
      .on(t.temporadaId, t.atletaId)
      .where(sql`${t.saidaEm} is null`),
    index("vinculo_clube").on(t.temporadaId, t.clubeId),
  ],
);

// Competição: a Liga ou uma Copa. Os campos de data/taxa/prêmio formam a
// "ficha da competição" citada no regulamento.
export const competicoes = pgTable("competicoes", {
  id: serial().primaryKey(),
  temporadaId: integer().notNull().references(() => temporadas.id),
  nome: varchar({ length: 80 }).notNull(),
  tipo: tipoCompeticaoEnum().notNull(),
  status: statusCompeticaoEnum().notNull().default("rascunho"),
  ativa: boolean().notNull().default(true),
  maxClubes: integer().notNull().default(16),
  dataInicio: data(),
  dataFim: data(),
  inscricaoSubInicio: data(),
  inscricaoInicio: data(),
  inscricaoFim: data(),
  taxaCentavos: integer(),
  premio: text(),
  bannerUrl: text(),
  campeaoClubeId: integer().references(() => clubes.id),
  criadoEm: agora(),
});

export const inscricoes = pgTable(
  "inscricoes",
  {
    id: serial().primaryKey(),
    competicaoId: integer()
      .notNull()
      .references(() => competicoes.id, { onDelete: "cascade" }),
    clubeId: integer().notNull().references(() => clubes.id),
    status: statusInscricaoEnum().notNull().default("pendente"),
    pago: boolean().notNull().default(false),
    capitaoSub: boolean().notNull().default(false),
    motivoRecusa: text(),
    criadoEm: agora(),
  },
  (t) => [uniqueIndex("inscricao_unica").on(t.competicaoId, t.clubeId)],
);

// Rodada da liga ou fase da copa, com o prazo para os jogos
export const rodadas = pgTable(
  "rodadas",
  {
    id: serial().primaryKey(),
    competicaoId: integer()
      .notNull()
      .references(() => competicoes.id, { onDelete: "cascade" }),
    numero: integer().notNull(),
    nome: varchar({ length: 40 }).notNull(),
    prazo: data(),
  },
  (t) => [uniqueIndex("rodada_unica").on(t.competicaoId, t.numero)],
);

export const partidas = pgTable(
  "partidas",
  {
    id: serial().primaryKey(),
    competicaoId: integer()
      .notNull()
      .references(() => competicoes.id, { onDelete: "cascade" }),
    rodadaId: integer()
      .notNull()
      .references(() => rodadas.id, { onDelete: "cascade" }),
    ordem: integer().notNull(),
    // Na copa, mandante/visitante ficam nulos até o vencedor da partida de origem ser definido
    mandanteId: integer().references(() => clubes.id),
    visitanteId: integer().references(() => clubes.id),
    origemMandanteId: integer().references((): AnyPgColumn => partidas.id),
    origemVisitanteId: integer().references((): AnyPgColumn => partidas.id),
    dataHora: data(),
    status: statusPartidaEnum().notNull().default("a_agendar"),
    // Gols já incluem a prorrogação
    golsMandante: integer(),
    golsVisitante: integer(),
    prorrogacao: boolean().notNull().default(false),
    penaltisMandante: integer(),
    penaltisVisitante: integer(),
    wo: tipoWoEnum(),
    transmitida: boolean().notNull().default(false),
    observacao: text(),
    atualizadoEm: agora(),
  },
  (t) => [index("partida_rodada").on(t.rodadaId), index("partida_competicao").on(t.competicaoId)],
);

// Estatística de cada atleta humano em cada partida.
// "gols" é o total do atleta; "golsPenalti" é quantos desses foram de pênalti.
export const estatisticas = pgTable(
  "estatisticas",
  {
    id: serial().primaryKey(),
    partidaId: integer()
      .notNull()
      .references(() => partidas.id, { onDelete: "cascade" }),
    atletaId: integer().notNull().references(() => atletas.id),
    clubeId: integer().notNull().references(() => clubes.id),
    gols: integer().notNull().default(0),
    golsPenalti: integer().notNull().default(0),
    assistencias: integer().notNull().default(0),
    mvp: boolean().notNull().default(false),
    goleiro: boolean().notNull().default(false),
    cartaoVermelho: boolean().notNull().default(false),
  },
  (t) => [uniqueIndex("estatistica_unica").on(t.partidaId, t.atletaId)],
);

export const suspensoes = pgTable("suspensoes", {
  id: serial().primaryKey(),
  atletaId: integer().notNull().references(() => atletas.id),
  competicaoId: integer()
    .notNull()
    .references(() => competicoes.id, { onDelete: "cascade" }),
  origemPartidaId: integer()
    .notNull()
    .references(() => partidas.id, { onDelete: "cascade" }),
  // Partida em que a suspensão é cumprida (nula se não houver próxima partida)
  cumprirPartidaId: integer().references(() => partidas.id, { onDelete: "set null" }),
});

export const noticias = pgTable("noticias", {
  id: serial().primaryKey(),
  titulo: varchar({ length: 120 }).notNull(),
  texto: text().notNull(),
  imagemUrl: text(),
  publicada: boolean().notNull().default(true),
  publicadaEm: agora(),
});

// Páginas editáveis no admin: "regulamento" e "proibidos"
export const paginas = pgTable("paginas", {
  slug: varchar({ length: 40 }).primaryKey(),
  titulo: varchar({ length: 120 }).notNull(),
  conteudo: text().notNull(),
  atualizadoEm: agora(),
});

export const admins = pgTable("admins", {
  id: serial().primaryKey(),
  nome: varchar({ length: 60 }).notNull(),
  email: varchar({ length: 120 }).notNull().unique(),
  senhaHash: text().notNull(),
  papel: papelAdminEnum().notNull().default("admin"),
  criadoEm: agora(),
});
