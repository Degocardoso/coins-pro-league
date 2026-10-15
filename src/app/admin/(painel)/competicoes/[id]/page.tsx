import { notFound } from "next/navigation";
import { exigirArea } from "@/controllers/sessao";
import { podeAcessar } from "@/lib/acesso";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { ClubeController } from "@/controllers/ClubeController";
import { getDb } from "@/models/db";
import { partidasRepo } from "@/models/repositories";
import { CompeticaoView } from "@/views/admin/telas/CompeticaoView";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const admin = await exigirArea("competicoes");
  const id = Number((await params).id);
  const db = getDb();
  const ctrl = new CompeticaoController(db);
  const c = Number.isInteger(id) ? await ctrl.buscar(id) : null;
  if (!c) notFound();
  const [inscricoes, clubes, temPartidas, resultados] = await Promise.all([
    ctrl.inscricoes(id),
    new ClubeController(db).listar(null),
    partidasRepo.existemNaCompeticao(db, id),
    ctrl.resultadosLancados(id),
  ]);
  return <CompeticaoView c={c} inscricoes={inscricoes} clubes={clubes} temPartidas={temPartidas} resultados={resultados} podeResultados={podeAcessar(admin, "resultados")} />;
}
