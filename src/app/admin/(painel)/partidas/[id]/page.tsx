import { notFound } from "next/navigation";
import { exigirAdmin } from "@/controllers/sessao";
import { PartidaController } from "@/controllers/PartidaController";
import { getDb } from "@/models/db";
import { ResultadoView } from "@/views/admin/telas/ResultadoView";

export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ desfeito?: string }>;
}) {
  await exigirAdmin();
  const id = Number((await params).id);
  const dados = Number.isInteger(id) ? await new PartidaController(getDb()).paraResultado(id) : null;
  if (!dados) notFound();
  return <ResultadoView dados={dados} desfeito={(await searchParams).desfeito === "1"} />;
}
