// npm run db:seed -- --teste — popula o banco com dados de TESTE (16 clubes fictícios e a tabela da liga)
// Não rode no banco de verdade: pede confirmação e recusa se já houver clubes.
import { sql } from "drizzle-orm";
import { getDb } from "../src/models/db";
import { CompeticaoController } from "../src/controllers/CompeticaoController";
import { semear } from "./semear";

if (!process.argv.includes("--teste")) {
  console.error("Isso cria dados de TESTE (clubes fictícios). Não rode no banco de verdade. Para confirmar: npm run db:seed -- --teste");
  process.exit(1);
}
const db = getDb();
const resultado = (await db.execute(sql`select count(*)::int as n from clubes`)) as unknown as { rows: { n: number }[] };
const n = resultado.rows[0]?.n ?? 0;
if (n > 0) {
  console.error(`O banco já tem ${n} clube(s). O seed é só para banco vazio de teste; nada foi feito.`);
  process.exit(1);
}
const { ligaId } = await semear(db);
const r = await new CompeticaoController(db).gerarTabelaLiga(ligaId);
console.log(`Seed pronto: ${r.rodadas} rodadas, ${r.partidas} partidas.`);
process.exit(0);
