import { notFound } from "next/navigation";
import { exigirAdmin } from "@/controllers/sessao";
import { ClubeController } from "@/controllers/ClubeController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { getDb } from "@/models/db";
import { temporadasRepo } from "@/models/repositories/cadastros";
import { ClubeView } from "@/views/admin/telas/ClubeView";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const id = Number((await params).id);
  const db = getDb();
  const temporada = await new TemporadaController(db).ativa();
  const dados = Number.isInteger(id) ? await new ClubeController(db).detalhe(id, temporada?.id ?? null) : null;
  if (!dados) notFound();
  const elencoLivre = temporada ? !(await temporadasRepo.jaComecou(db, temporada.id)) : true;
  return <ClubeView dados={dados} temporada={temporada?.nome ?? null} elencoLivre={elencoLivre} />;
}
