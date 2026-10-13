// MODEL — conexão com o banco
// Na Vercel (Fluid compute), a função "dorme" entre acessos. Seguindo a recomendação da Vercel:
// pool pequeno, conexões paradas fechando em 5 s e attachDatabasePool, que fecha as conexões
// antes de a função dormir. Sem isso, a função acorda com uma conexão morta e a página trava.
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import * as schema from "./schema";

// Tipo comum aos drivers (pg em produção, PGlite nos testes)
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

let instancia: Db | undefined;

export function getDb(): Db {
  if (!instancia) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não definida");
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 5_000, // conexão parada fecha logo
      connectionTimeoutMillis: 10_000, // não espera para sempre por uma conexão
      query_timeout: 15_000, // consulta travada vira erro na tela, não página carregando para sempre
      keepAlive: true,
      ssl: local ? false : { rejectUnauthorized: false }, // tráfego com o Supabase criptografado
    });
    // Conexão parada derrubada pelo banco: o pool descarta e abre outra na próxima consulta.
    // Sem este tratamento, o aviso vira erro não tratado e pode derrubar a função inteira.
    pool.on("error", (e) => console.warn("Conexão ociosa com o banco encerrada:", e.message));
    attachDatabasePool(pool);
    instancia = drizzle(pool, { schema, casing: "snake_case" }) as unknown as Db;
  }
  return instancia;
}

export { schema };
