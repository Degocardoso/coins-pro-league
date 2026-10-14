CREATE TABLE "configuracoes" (
	"chave" varchar(60) PRIMARY KEY NOT NULL,
	"valor" jsonb NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_por" integer
);
--> statement-breakpoint
ALTER TABLE "configuracoes" ADD CONSTRAINT "configuracoes_atualizado_por_admins_id_fk" FOREIGN KEY ("atualizado_por") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;