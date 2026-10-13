CREATE TYPE "public"."papel_admin" AS ENUM('admin', 'moderador');--> statement-breakpoint
CREATE TYPE "public"."plataforma" AS ENUM('ps5', 'xbox', 'pc');--> statement-breakpoint
CREATE TYPE "public"."status_competicao" AS ENUM('rascunho', 'inscricoes', 'em_andamento', 'encerrada');--> statement-breakpoint
CREATE TYPE "public"."status_inscricao" AS ENUM('pendente', 'confirmada', 'espera', 'recusada');--> statement-breakpoint
CREATE TYPE "public"."status_partida" AS ENUM('a_agendar', 'agendada', 'finalizada', 'wo');--> statement-breakpoint
CREATE TYPE "public"."tipo_competicao" AS ENUM('liga', 'copa');--> statement-breakpoint
CREATE TYPE "public"."tipo_wo" AS ENUM('mandante_vence', 'visitante_vence', 'duplo');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(60) NOT NULL,
	"email" varchar(120) NOT NULL,
	"senha_hash" text NOT NULL,
	"papel" "papel_admin" DEFAULT 'admin' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "atletas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_personagem" varchar(40) NOT NULL,
	"plataforma" "plataforma" NOT NULL,
	"id_plataforma" varchar(60) NOT NULL,
	"twitch" varchar(40),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "atletas_nomePersonagem_unique" UNIQUE("nome_personagem")
);
--> statement-breakpoint
CREATE TABLE "clubes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(60) NOT NULL,
	"slug" varchar(80) NOT NULL,
	"escudo_url" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clubes_nome_unique" UNIQUE("nome"),
	CONSTRAINT "clubes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "competicoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"temporada_id" integer NOT NULL,
	"nome" varchar(80) NOT NULL,
	"tipo" "tipo_competicao" NOT NULL,
	"status" "status_competicao" DEFAULT 'rascunho' NOT NULL,
	"ativa" boolean DEFAULT true NOT NULL,
	"max_clubes" integer DEFAULT 16 NOT NULL,
	"data_inicio" timestamp with time zone,
	"data_fim" timestamp with time zone,
	"inscricao_sub_inicio" timestamp with time zone,
	"inscricao_inicio" timestamp with time zone,
	"inscricao_fim" timestamp with time zone,
	"taxa_centavos" integer,
	"premio" text,
	"banner_url" text,
	"campeao_clube_id" integer,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estatisticas" (
	"id" serial PRIMARY KEY NOT NULL,
	"partida_id" integer NOT NULL,
	"atleta_id" integer NOT NULL,
	"clube_id" integer NOT NULL,
	"gols" integer DEFAULT 0 NOT NULL,
	"gols_penalti" integer DEFAULT 0 NOT NULL,
	"assistencias" integer DEFAULT 0 NOT NULL,
	"mvp" boolean DEFAULT false NOT NULL,
	"goleiro" boolean DEFAULT false NOT NULL,
	"cartao_vermelho" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inscricoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"competicao_id" integer NOT NULL,
	"clube_id" integer NOT NULL,
	"status" "status_inscricao" DEFAULT 'pendente' NOT NULL,
	"pago" boolean DEFAULT false NOT NULL,
	"capitao_sub" boolean DEFAULT false NOT NULL,
	"motivo_recusa" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "noticias" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"texto" text NOT NULL,
	"imagem_url" text,
	"publicada" boolean DEFAULT true NOT NULL,
	"publicada_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paginas" (
	"slug" varchar(40) PRIMARY KEY NOT NULL,
	"titulo" varchar(120) NOT NULL,
	"conteudo" text NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partidas" (
	"id" serial PRIMARY KEY NOT NULL,
	"competicao_id" integer NOT NULL,
	"rodada_id" integer NOT NULL,
	"ordem" integer NOT NULL,
	"mandante_id" integer,
	"visitante_id" integer,
	"origem_mandante_id" integer,
	"origem_visitante_id" integer,
	"data_hora" timestamp with time zone,
	"status" "status_partida" DEFAULT 'a_agendar' NOT NULL,
	"gols_mandante" integer,
	"gols_visitante" integer,
	"prorrogacao" boolean DEFAULT false NOT NULL,
	"penaltis_mandante" integer,
	"penaltis_visitante" integer,
	"wo" "tipo_wo",
	"transmitida" boolean DEFAULT false NOT NULL,
	"observacao" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rodadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"competicao_id" integer NOT NULL,
	"numero" integer NOT NULL,
	"nome" varchar(40) NOT NULL,
	"prazo" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "suspensoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"atleta_id" integer NOT NULL,
	"competicao_id" integer NOT NULL,
	"origem_partida_id" integer NOT NULL,
	"cumprir_partida_id" integer
);
--> statement-breakpoint
CREATE TABLE "temporadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" integer NOT NULL,
	"nome" varchar(60) NOT NULL,
	"ativa" boolean DEFAULT false NOT NULL,
	"janela_inicio" timestamp with time zone,
	"janela_fim" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "temporadas_numero_unique" UNIQUE("numero")
);
--> statement-breakpoint
CREATE TABLE "vinculos" (
	"id" serial PRIMARY KEY NOT NULL,
	"temporada_id" integer NOT NULL,
	"clube_id" integer NOT NULL,
	"atleta_id" integer NOT NULL,
	"capitao" boolean DEFAULT false NOT NULL,
	"entrada_em" timestamp with time zone DEFAULT now() NOT NULL,
	"saida_em" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "competicoes" ADD CONSTRAINT "competicoes_temporada_id_temporadas_id_fk" FOREIGN KEY ("temporada_id") REFERENCES "public"."temporadas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competicoes" ADD CONSTRAINT "competicoes_campeao_clube_id_clubes_id_fk" FOREIGN KEY ("campeao_clube_id") REFERENCES "public"."clubes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_partida_id_partidas_id_fk" FOREIGN KEY ("partida_id") REFERENCES "public"."partidas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_clube_id_clubes_id_fk" FOREIGN KEY ("clube_id") REFERENCES "public"."clubes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_competicao_id_competicoes_id_fk" FOREIGN KEY ("competicao_id") REFERENCES "public"."competicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_clube_id_clubes_id_fk" FOREIGN KEY ("clube_id") REFERENCES "public"."clubes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_competicao_id_competicoes_id_fk" FOREIGN KEY ("competicao_id") REFERENCES "public"."competicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_rodada_id_rodadas_id_fk" FOREIGN KEY ("rodada_id") REFERENCES "public"."rodadas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_mandante_id_clubes_id_fk" FOREIGN KEY ("mandante_id") REFERENCES "public"."clubes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_visitante_id_clubes_id_fk" FOREIGN KEY ("visitante_id") REFERENCES "public"."clubes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_origem_mandante_id_partidas_id_fk" FOREIGN KEY ("origem_mandante_id") REFERENCES "public"."partidas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_origem_visitante_id_partidas_id_fk" FOREIGN KEY ("origem_visitante_id") REFERENCES "public"."partidas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rodadas" ADD CONSTRAINT "rodadas_competicao_id_competicoes_id_fk" FOREIGN KEY ("competicao_id") REFERENCES "public"."competicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensoes" ADD CONSTRAINT "suspensoes_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensoes" ADD CONSTRAINT "suspensoes_competicao_id_competicoes_id_fk" FOREIGN KEY ("competicao_id") REFERENCES "public"."competicoes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensoes" ADD CONSTRAINT "suspensoes_origem_partida_id_partidas_id_fk" FOREIGN KEY ("origem_partida_id") REFERENCES "public"."partidas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suspensoes" ADD CONSTRAINT "suspensoes_cumprir_partida_id_partidas_id_fk" FOREIGN KEY ("cumprir_partida_id") REFERENCES "public"."partidas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_temporada_id_temporadas_id_fk" FOREIGN KEY ("temporada_id") REFERENCES "public"."temporadas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_clube_id_clubes_id_fk" FOREIGN KEY ("clube_id") REFERENCES "public"."clubes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vinculos" ADD CONSTRAINT "vinculos_atleta_id_atletas_id_fk" FOREIGN KEY ("atleta_id") REFERENCES "public"."atletas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "atleta_plataforma_unico" ON "atletas" USING btree ("plataforma","id_plataforma");--> statement-breakpoint
CREATE UNIQUE INDEX "estatistica_unica" ON "estatisticas" USING btree ("partida_id","atleta_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inscricao_unica" ON "inscricoes" USING btree ("competicao_id","clube_id");--> statement-breakpoint
CREATE INDEX "partida_rodada" ON "partidas" USING btree ("rodada_id");--> statement-breakpoint
CREATE INDEX "partida_competicao" ON "partidas" USING btree ("competicao_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rodada_unica" ON "rodadas" USING btree ("competicao_id","numero");--> statement-breakpoint
CREATE UNIQUE INDEX "vinculo_ativo_unico" ON "vinculos" USING btree ("temporada_id","atleta_id") WHERE "vinculos"."saida_em" is null;--> statement-breakpoint
CREATE INDEX "vinculo_clube" ON "vinculos" USING btree ("temporada_id","clube_id");