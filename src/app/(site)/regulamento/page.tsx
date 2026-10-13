import { getDb } from "@/models/db";
import { SiteController } from "@/controllers/SiteController";
import { RegulamentoView } from "@/views/site/RegulamentoView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Regulamento" };

export default async function Pagina() {
  return <RegulamentoView dados={await new SiteController(getDb()).regulamento()} />;
}
