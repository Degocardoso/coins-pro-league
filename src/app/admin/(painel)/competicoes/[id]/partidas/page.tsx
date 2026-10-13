import { notFound, redirect } from "next/navigation";
import { exigirAdmin } from "@/controllers/sessao";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { PartidaController } from "@/controllers/PartidaController";
import { getDb } from "@/models/db";
import { RodadaView } from "@/views/admin/telas/RodadaView";

export default async function Pagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rodada?: string }>;
}) {
  await exigirAdmin();
  const id = Number((await params).id);
  const numero = Number((await searchParams).rodada) || undefined;
  const db = getDb();
  const c = Number.isInteger(id) ? await new CompeticaoController(db).buscar(id) : null;
  if (!c) notFound();
  const dados = await new PartidaController(db).rodada(id, numero);
  if (!dados) redirect(`/admin/competicoes/${id}`);
  return <RodadaView competicao={c} dados={dados} />;
}
