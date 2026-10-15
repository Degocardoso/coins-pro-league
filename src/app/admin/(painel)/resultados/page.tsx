import { exigirArea } from "@/controllers/sessao";
import { PainelController } from "@/controllers/PainelController";
import { getDb } from "@/models/db";
import { ResultadosView } from "@/views/admin/telas/ResultadosView";

export default async function Pagina() {
  await exigirArea("resultados");
  return <ResultadosView competicoes={(await new PainelController(getDb()).resumo()).competicoes} />;
}
