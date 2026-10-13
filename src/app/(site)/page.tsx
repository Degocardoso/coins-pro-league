import { getDb } from "@/models/db";
import { SiteController } from "@/controllers/SiteController";
import { LigaView } from "@/views/site/LigaView";

export const dynamic = "force-dynamic";

export default async function Pagina() {
  return <LigaView dados={await new SiteController(getDb()).aLiga()} />;
}
