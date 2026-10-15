import { notFound } from "next/navigation";
import { exigirArea } from "@/controllers/sessao";
import { PartidaController } from "@/controllers/PartidaController";
import { getDb } from "@/models/db";
import { ResultadoView } from "@/views/admin/telas/ResultadoView";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  await exigirArea("resultados");
  const id = Number((await params).id);
  const dados = Number.isInteger(id) ? await new PartidaController(getDb()).paraResultado(id) : null;
  if (!dados) notFound();
  return <ResultadoView dados={dados} />;
}
