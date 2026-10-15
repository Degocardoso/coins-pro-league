import { exigirAdmin } from "@/controllers/sessao";
import { PainelController } from "@/controllers/PainelController";
import { podeAcessar } from "@/lib/acesso";
import { getDb } from "@/models/db";
import { PainelView } from "@/views/admin/telas/PainelView";

export default async function Pagina() {
  const admin = await exigirAdmin();
  const acesso = {
    competicoes: podeAcessar(admin, "competicoes"),
    resultados: podeAcessar(admin, "resultados"),
    temporada: podeAcessar(admin, "temporada"),
  };
  return <PainelView dados={await new PainelController(getDb()).resumo()} acesso={acesso} />;
}
