ALTER TABLE "admins" ADD COLUMN "dono" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "areas" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "versao_sessao" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "ultimo_login_em" timestamp with time zone;--> statement-breakpoint
-- Ninguém perde acesso no deploy: o primeiro usuário vira dono e quem já existe ganha todas as áreas
UPDATE "admins" SET "dono" = true WHERE "id" = (SELECT min("id") FROM "admins");--> statement-breakpoint
UPDATE "admins" SET "areas" = ARRAY['competicoes','resultados','clubes','noticias','regulamento','temporada','obs']::text[];
