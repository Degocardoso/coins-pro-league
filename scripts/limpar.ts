// npm run db:limpar -- --sim
// Apaga TODOS os dados da liga (temporadas, clubes, atletas, partidas, notícias, imagens).
// Mantém os admins e os textos do regulamento.
import { sql } from "drizzle-orm";
import { getDb } from "../src/models/db";

if (!process.argv.includes("--sim")) {
  console.error("Isso apaga todos os dados da liga. Para confirmar: npm run db:limpar -- --sim");
  process.exit(1);
}
await getDb().execute(sql`
  truncate table estatisticas, suspensoes, partidas, rodadas, inscricoes, competicoes,
    vinculos, atletas, clubes, temporadas, noticias, arquivos restart identity cascade
`);
console.log("Banco limpo. Admins e regulamento foram mantidos.");
process.exit(0);
