import { exigirArea } from "@/controllers/sessao";
import { ClubeController } from "@/controllers/ClubeController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { getDb } from "@/models/db";
import { ClubesView } from "@/views/admin/telas/ClubesView";

export default async function Pagina() {
  await exigirArea("clubes");
  const temporada = await new TemporadaController(getDb()).ativa();
  return <ClubesView lista={await new ClubeController(getDb()).listar(temporada?.id ?? null)} />;
}
