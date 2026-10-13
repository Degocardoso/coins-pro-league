import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// O drizzle-kit não lê o .env sozinho
if (existsSync(".env")) process.loadEnvFile(".env");

const url = process.env.DATABASE_URL_MIGRACAO ?? process.env.DATABASE_URL ?? "";
const precisaBanco = process.argv.some((a) => ["migrate", "push", "pull", "studio"].includes(a));
if (precisaBanco && !url) {
  throw new Error(
    existsSync(".env")
      ? "O .env existe, mas DATABASE_URL_MIGRACAO está vazia. Confira o nome da variável e salve o arquivo."
      : "Arquivo .env não encontrado nesta pasta. Rode: copy .env.example .env",
  );
}

// Migrações: use o Session pooler (porta 5432). O site usa o Transaction pooler (6543).
export default defineConfig({
  schema: "./src/models/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url },
});
