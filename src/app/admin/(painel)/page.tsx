import { exigirAdmin } from "@/controllers/sessao";
import { PainelController } from "@/controllers/PainelController";
import { podeAcessar } from "@/lib/acesso";
import { getDb } from "@/models/db";
import { PainelView } from "@/views/admin/telas/PainelView";
import { DiscordController } from "@/controllers/DiscordController";

export default async function Pagina() {
  const admin = await exigirAdmin();
  const acesso = {
    competicoes: podeAcessar(admin, "competicoes"),
    resultados: podeAcessar(admin, "resultados"),
    temporada: podeAcessar(admin, "temporada"),
  };
  const [dados, convite] = await Promise.all([new PainelController(getDb()).resumo(), new DiscordController(getDb()).convite()]);
  return <PainelView dados={dados} acesso={acesso} semDiscord={!convite} />;
}
