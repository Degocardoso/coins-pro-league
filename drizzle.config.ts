import { defineConfig } from "drizzle-kit";

// Lê o .env (o drizzle-kit não carrega sozinho)
try {
  process.loadEnvFile(".env");
} catch {}

// Para migrar no Supabase, use a conexão DIRETA (porta 5432) ou o
// "Session pooler". O site em produção usa o "Transaction pooler" (6543).
export default defineConfig({
  schema: "./src/models/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL_MIGRACAO ?? process.env.DATABASE_URL ?? "" },
});
