// npm run db:seed — popula o banco apontado por DATABASE_URL com dados de teste
import { getDb } from "../src/models/db";
import { CompeticaoController } from "../src/controllers/CompeticaoController";
import { semear } from "./semear";

const db = getDb();
const { ligaId } = await semear(db);
const r = await new CompeticaoController(db).gerarTabelaLiga(ligaId);
console.log(`Seed pronto: ${r.rodadas} rodadas, ${r.partidas} partidas.`);
process.exit(0);
