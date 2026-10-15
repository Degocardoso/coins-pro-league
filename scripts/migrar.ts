// npm run db:migrate — aplica as migrações da pasta drizzle/ no banco, mostrando cada passo.
// Substitui o "drizzle-kit migrate", que não tem tempo-limite e às vezes falha sem mostrar o erro.
// Usa a mesma tabela de controle do Drizzle (drizzle.__drizzle_migrations): é compatível com o que já foi aplicado.
import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const url = process.env.DATABASE_URL_MIGRACAO || process.env.DATABASE_URL;
if (!url) {
  console.error("Falta a DATABASE_URL_MIGRACAO no .env (a do Session pooler, porta 5432).");
  process.exit(1);
}
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
let destino = "banco";
try {
  destino = new URL(url).host;
} catch {
  console.error("A DATABASE_URL_MIGRACAO não parece um endereço válido. Confira se copiou inteira, sem espaços.");
  process.exit(1);
}

type Erro = { code?: string; message?: string; cause?: Erro };
function explicar(e: Erro): string {
  const msg = `${e.message ?? ""} ${e.cause?.message ?? ""}`;
  const code = e.code ?? e.cause?.code;
  if (/timeout|ETIMEDOUT/i.test(msg) || code === "ETIMEDOUT")
    return "Não conectou em 15 segundos. Confira se a DATABASE_URL_MIGRACAO é a do Session pooler (porta 5432) e se a internet, o antivírus ou a rede não bloqueiam a porta 5432.";
  if (code === "ENOTFOUND") return "Endereço do banco não encontrado. Confira o trecho depois do @ na DATABASE_URL_MIGRACAO.";
  if (code === "28P01" || /password authentication failed/i.test(msg)) return "Senha do banco errada na DATABASE_URL_MIGRACAO.";
  if (/Tenant or user not found/i.test(msg)) return "Usuário do pooler errado. No Supabase ele é postgres.ID_DO_PROJETO (com o ponto e o ID).";
  if (code === "ECONNREFUSED") return "O banco recusou a conexão. Confira a porta (5432 para migração).";
  return e.cause?.message ?? e.message ?? String(e);
}

const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 15_000, ssl: local ? false : { rejectUnauthorized: false } });
const sair = async (codigo: number) => {
  await pool.end().catch(() => {});
  process.exit(codigo);
};

console.log(`Conectando em ${destino}...`);
try {
  const c = await pool.connect();
  c.release();
} catch (e) {
  console.error(`Falhou: ${explicar(e as Erro)}`);
  await sair(1);
}

// Quais migrações faltam: o Drizzle aplica as que são mais novas que a última registrada no banco
const jornal: { tag: string; when: number }[] = JSON.parse(readFileSync("drizzle/meta/_journal.json", "utf8")).entries;
let ultima = 0;
try {
  const r = await pool.query<{ ultima: string | null }>("select max(created_at) as ultima from drizzle.__drizzle_migrations");
  ultima = Number(r.rows[0]?.ultima ?? 0);
} catch {
  ultima = 0; // banco novo: a tabela de controle ainda não existe
}
const pendentes = jornal.filter((m) => m.when > ultima);
if (!pendentes.length) {
  console.log(`Banco em dia: as ${jornal.length} migrações já estão aplicadas. Nada a fazer.`);
  await sair(0);
}

console.log(`Faltam ${pendentes.length}: ${pendentes.map((m) => m.tag).join(", ")}`);
try {
  await migrate(drizzle(pool), { migrationsFolder: "drizzle" });
} catch (e) {
  console.error(`A migração falhou e nada foi alterado (tudo roda numa transação só): ${explicar(e as Erro)}`);
  await sair(1);
}
console.log(`Pronto: aplicadas ${pendentes.map((m) => m.tag).join(", ")}.`);
await sair(0);
