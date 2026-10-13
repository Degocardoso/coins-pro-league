// npm run db:simular -- 6     lança resultados aleatórios nas 6 primeiras rodadas (padrão: 5)
import { getDb } from "../src/models/db";
import { simular } from "./simulacao";

const rodadas = Number(process.argv[2]) || 5;
const n = await simular(getDb(), rodadas);
console.log(`${n} resultados simulados nas ${rodadas} primeiras rodadas. Para apagar tudo: npm run db:limpar -- --sim`);
process.exit(0);
