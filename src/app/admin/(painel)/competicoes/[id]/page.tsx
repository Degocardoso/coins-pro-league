import { notFound } from "next/navigation";
import { exigirArea } from "@/controllers/sessao";
import { podeAcessar } from "@/lib/acesso";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { ClubeController } from "@/controllers/ClubeController";
import { getDb } from "@/models/db";
import { partidasRepo } from "@/models/repositories";
import { CompeticaoView } from "@/views/admin/telas/CompeticaoView";
import { DivulgacaoController } from "@/controllers/DivulgacaoController";
import { origemDoSite } from "@/lib/origem";

export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const admin = await exigirArea("competicoes");
  const id = Number((await params).id);
  const db = getDb();
  const ctrl = new CompeticaoController(db);
  const c = Number.isInteger(id) ? await ctrl.buscar(id) : null;
  if (!c) notFound();
  const [inscricoes, clubes, temPartidas, resultados, divulgacao] = await Promise.all([
    ctrl.inscricoes(id),
    new ClubeController(db).listar(null),
    partidasRepo.existemNaCompeticao(db, id),
    ctrl.resultadosLancados(id),
    origemDoSite().then((origem) => new DivulgacaoController(db).dados(id, origem)),
  ]);
  return (
    <CompeticaoView
      c={c}
      inscricoes={inscricoes}
      clubes={clubes}
      temPartidas={temPartidas}
      resultados={resultados}
      podeResultados={podeAcessar(admin, "resultados")}
      // versão: as prévias das artes recarregam a cada visita (a ficha pode ter mudado)
      divulgacao={divulgacao ? { textos: divulgacao.textos, convites: divulgacao.convites, versao: Date.now() } : null}
    />
  );
}
