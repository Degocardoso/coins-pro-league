import { exigirArea } from "@/controllers/sessao";
import { obsLiberada, senhaObsConfigurada } from "@/controllers/obsAcesso";
import { LigaNaLiveController } from "@/controllers/LigaNaLiveController";
import { getDb } from "@/models/db";
import { ObsBloqueadaView, ObsView } from "@/views/admin/telas/ObsView";

export default async function Pagina() {
  const admin = await exigirArea("obs");
  if (!(await obsLiberada(admin.id))) return <ObsBloqueadaView configurada={senhaObsConfigurada()} />;
  return <ObsView liga={await new LigaNaLiveController(getDb()).estado()} />;
}
