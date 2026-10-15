import { exigirArea } from "@/controllers/sessao";
import { PaginaController } from "@/controllers/PaginaController";
import { getDb } from "@/models/db";
import { RegulamentoView } from "@/views/admin/telas/RegulamentoView";

export default async function Pagina() {
  await exigirArea("regulamento");
  const ctrl = new PaginaController(getDb());
  const [regulamento, proibidos] = await Promise.all([ctrl.buscar("regulamento"), ctrl.buscar("proibidos")]);
  return <RegulamentoView regulamento={regulamento} proibidos={proibidos} />;
}
