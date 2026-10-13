import { getDb } from "@/models/db";
import { InscricaoController } from "@/controllers/InscricaoController";
import { InscricaoView } from "@/views/site/InscricaoView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inscrever clube" };

export default async function Pagina() {
  return <InscricaoView abertas={await new InscricaoController(getDb()).abertas()} />;
}
