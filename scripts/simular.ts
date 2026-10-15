// npm run db:simular -- 6 --teste     lança resultados ALEATÓRIOS nas 6 primeiras rodadas (padrão: 5)
// Não rode no banco de verdade: os resultados falsos entrariam nos seus jogos. Pede confirmação.
import { getDb } from "../src/models/db";
import { simular } from "./simulacao";

if (!process.argv.includes("--teste")) {
  console.error("Isso lança resultados FALSOS. Não rode no banco de verdade. Para confirmar: npm run db:simular -- 6 --teste");
  process.exit(1);
}
const rodadas = Number(process.argv.slice(2).find((a) => /^\d+$/.test(a))) || 5;
const n = await simular(getDb(), rodadas);
console.log(`${n} resultados simulados nas ${rodadas} primeiras rodadas. Para apagar tudo: npm run db:limpar -- --sim`);
process.exit(0);
