import { getDb } from "@/models/db";
import { InscricaoController } from "@/controllers/InscricaoController";
import { InscricaoView } from "@/views/site/InscricaoView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inscrever clube" };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const c = Number((await searchParams).c) || undefined;
  return <InscricaoView abertas={await new InscricaoController(getDb()).abertas()} competicaoId={c} />;
}
