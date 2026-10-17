import { exigirArea } from "@/controllers/sessao";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { PainelController } from "@/controllers/PainelController";
import { getDb } from "@/models/db";
import { CompeticoesView } from "@/views/admin/telas/CompeticoesView";
import { Cabeca } from "@/views/admin/componentes";
import { DiscordController } from "@/controllers/DiscordController";
import { DiscordDaLiga } from "@/views/admin/DiscordDaLiga";

export default async function Pagina() {
  await exigirArea("competicoes");
  const [temporada, convite] = await Promise.all([new TemporadaController(getDb()).ativa(), new DiscordController(getDb()).convite()]);
  if (!temporada)
    return (
      <>
        <Cabeca titulo="Competições" />
        <p className="vazio">Nenhuma temporada ativa. <a href="/admin/temporada">Crie uma temporada</a> primeiro.</p>
        <DiscordDaLiga convite={convite} />
      </>
    );
  const lista = await new CompeticaoController(getDb()).listar(temporada.id);
  const pendentes = await new PainelController(getDb()).pendentesPorCompeticao(lista.map((c) => c.id));
  return (
    <>
      <CompeticoesView lista={lista} temporada={temporada.nome} pendentes={pendentes} />
      <DiscordDaLiga convite={convite} />
    </>
  );
}
