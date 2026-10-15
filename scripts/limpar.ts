// npm run db:limpar -- --sim            apaga TODOS os dados da liga e recomeça os números do 1
// npm run db:limpar -- --sim --equipe   além disso, tira da Equipe todo mundo menos o dono
// Apaga: temporadas, competições, inscrições, rodadas, partidas, resultados, estatísticas, suspensões,
//        clubes, atletas, notícias, imagens enviadas e o estado do botão "liga na live".
// Mantém: o dono (e a Equipe, sem --equipe) e os textos do regulamento.
import { sql } from "drizzle-orm";
import { getDb } from "../src/models/db";

const args = process.argv.slice(2);
if (!args.includes("--sim")) {
  console.error("Isso apaga TODOS os dados da liga e não tem volta. Para confirmar: npm run db:limpar -- --sim");
  process.exit(1);
}
const db = getDb();
await db.execute(sql`
  truncate table estatisticas, suspensoes, partidas, rodadas, inscricoes, competicoes,
    vinculos, atletas, clubes, temporadas, noticias, arquivos, configuracoes restart identity cascade
`);
let equipe = "A Equipe foi mantida.";
if (args.includes("--equipe")) {
  const r = (await db.execute(sql`delete from admins where dono = false`)) as unknown as { rowCount?: number };
  equipe = `Saíram da Equipe: ${r.rowCount ?? 0} pessoa(s). Só o dono ficou.`;
}
console.log(`Banco limpo: tudo da liga foi apagado e os números recomeçam do 1. ${equipe} O regulamento foi mantido.`);
process.exit(0);
