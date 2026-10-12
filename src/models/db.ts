// MODEL — conexão com o banco
import { drizzle } from "drizzle-orm/postgres-js";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import postgres from "postgres";
import * as schema from "./schema";

// Tipo comum aos drivers (postgres-js em produção, PGlite nos testes)
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let instancia: Db | undefined;

export function getDb(): Db {
  if (!instancia) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não definida");
    // prepare:false é obrigatório no Transaction pooler do Supabase
    const cliente = postgres(url, { prepare: false, max: 1 });
    instancia = drizzle(cliente, { schema, casing: "snake_case" }) as unknown as Db;
  }
  return instancia;
}

export { schema };
