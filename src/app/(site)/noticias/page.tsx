import { getDb } from "@/models/db";
import { JornalController } from "@/controllers/JornalController";
import { JornalView } from "@/views/site/JornalView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notícias", description: "Jornal da Coin's Pro League: notícias da liga, rodada a rodada." };

export default async function Pagina({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const pagina = Number((await searchParams).pagina) || 1;
  return <JornalView capa={await new JornalController(getDb()).capa(pagina)} />;
}
