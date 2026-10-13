import { exigirAdmin } from "@/controllers/sessao";
import { NoticiaController } from "@/controllers/NoticiaController";
import { getDb } from "@/models/db";
import { NoticiasView } from "@/views/admin/telas/NoticiasView";

export default async function Pagina() {
  await exigirAdmin();
  return <NoticiasView lista={await new NoticiaController(getDb()).listar()} />;
}
