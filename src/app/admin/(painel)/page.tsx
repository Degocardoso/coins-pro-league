import { exigirAdmin } from "@/controllers/sessao";
import { PainelController } from "@/controllers/PainelController";
import { getDb } from "@/models/db";
import { PainelView } from "@/views/admin/telas/PainelView";

export default async function Pagina() {
  await exigirAdmin();
  return <PainelView dados={await new PainelController(getDb()).resumo()} />;
}
