import { exigirArea } from "@/controllers/sessao";
import { TemporadaController } from "@/controllers/TemporadaController";
import { getDb } from "@/models/db";
import { TemporadaView } from "@/views/admin/telas/TemporadaView";

export default async function Pagina() {
  await exigirArea("temporada");
  return <TemporadaView lista={await new TemporadaController(getDb()).listar()} />;
}
