import { exigirArea } from "@/controllers/sessao";
import { NoticiaController } from "@/controllers/NoticiaController";
import { getDb } from "@/models/db";
import { NoticiasView } from "@/views/admin/telas/NoticiasView";

export default async function Pagina() {
  await exigirArea("noticias");
  return <NoticiasView lista={await new NoticiaController(getDb()).listar()} />;
}
