import { exigirAdmin } from "@/controllers/sessao";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { getDb } from "@/models/db";
import { CompeticoesView } from "@/views/admin/telas/CompeticoesView";
import { Cabeca } from "@/views/admin/componentes";

export default async function Pagina() {
  await exigirAdmin();
  const temporada = await new TemporadaController(getDb()).ativa();
  if (!temporada)
    return (
      <>
        <Cabeca titulo="Competições" />
        <p className="vazio">Nenhuma temporada ativa. <a href="/admin/temporada">Crie uma temporada</a> primeiro.</p>
      </>
    );
  const lista = await new CompeticaoController(getDb()).listar(temporada.id);
  return <CompeticoesView lista={lista} temporada={temporada.nome} />;
}
