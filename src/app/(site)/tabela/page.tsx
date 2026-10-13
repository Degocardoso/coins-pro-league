import { getDb } from "@/models/db";
import { SiteController } from "@/controllers/SiteController";
import { TabelaView } from "@/views/site/TabelaView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tabela" };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ c?: string; rodada?: string }> }) {
  const q = await searchParams;
  const dados = await new SiteController(getDb()).tabela(Number(q.c) || null, Number(q.rodada) || undefined);
  return <TabelaView dados={dados} />;
}
