import { exigirDono } from "@/controllers/sessao";
import { EquipeController } from "@/controllers/EquipeController";
import { getDb } from "@/models/db";
import { EquipeView } from "@/views/admin/telas/EquipeView";

export default async function Pagina() {
  await exigirDono();
  return <EquipeView pessoas={await new EquipeController(getDb()).listar()} />;
}
