CREATE TABLE "arquivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"mime" varchar(40) NOT NULL,
	"tamanho" integer NOT NULL,
	"bytes" "bytea" NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
