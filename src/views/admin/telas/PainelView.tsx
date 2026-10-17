// VIEW — tela inicial do painel
import type { PainelController } from "@/controllers/PainelController";
import { formatarDataHora } from "@/lib/datas";
import { Cabeca, Clube, Secao, Selo } from "../componentes";

type Dados = Awaited<ReturnType<PainelController["resumo"]>>;
export type AcessoPainel = { competicoes: boolean; resultados: boolean; temporada: boolean };

export function PainelView({ dados, acesso, semDiscord }: { dados: Dados; acesso: AcessoPainel; semDiscord: boolean }) {
  if (!dados.temporada)
    return (
      <>
        <Cabeca titulo="Painel" />
        <p className="vazio">
          Nenhuma temporada ativa.{" "}
          {acesso.temporada ? <><a href="/admin/temporada">Crie a primeira temporada</a> para começar.</> : "Quem cuida da Temporada cria a primeira."}
        </p>
      </>
    );
  const jogadas = dados.competicoes.reduce((s, c) => s + c.progresso.jogadas, 0);
  const total = dados.competicoes.reduce((s, c) => s + c.progresso.total, 0);
  return (
    <>
      <Cabeca titulo="Painel" descricao={dados.temporada.nome} />
      <div className="numeros">
        <div>
          <strong>{dados.competicoes.length}</strong>
          <span>competições</span>
        </div>
        <div>
          <strong>
            {jogadas}/{total}
          </strong>
          <span>partidas com resultado</span>
        </div>
        <div>
          <strong style={{ color: dados.inscricoesPendentes ? "var(--ouro-texto)" : undefined }}>{dados.inscricoesPendentes}</strong>
          <span>inscrições esperando análise</span>
        </div>
      </div>
      {acesso.competicoes && semDiscord && (
        <div className="msg msg-alerta">
          Falta o link do Discord da liga: é ele que o capitão recebe logo depois de se inscrever.{" "}
          <a href="/admin/competicoes#discord">Configurar agora</a>
        </div>
      )}

      {acesso.competicoes && dados.pendentes.length > 0 && (
        <Secao titulo="Inscrições para analisar" dica="Abra a competição para confirmar ou recusar. Sem vaga, a confirmação manda o clube para a lista de espera.">
          <div className="rolagem">
            <table className="tabela">
              <thead><tr><th>Clube</th><th>Competição</th><th>Recebida em</th><th /></tr></thead>
              <tbody>
                {dados.pendentes.map((i) => (
                  <tr key={i.inscricaoId}>
                    <td>
                      <Clube nome={i.clube} escudoUrl={i.escudoUrl} />
                      {i.capitaoSub && <span className="selo selo-ouro" style={{ marginLeft: 8 }}>Capitão sub</span>}
                    </td>
                    <td>{i.competicao}</td>
                    <td>{formatarDataHora(i.criadoEm)}</td>
                    <td className="acoes"><a className="btn btn-mini btn-ouro" href={`/admin/competicoes/${i.competicaoId}#inscricoes`}>Analisar</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      <Secao titulo="Competições da temporada">
        {dados.competicoes.length === 0 ? (
          <p className="vazio">
            Nenhuma competição ainda.{" "}
            {acesso.competicoes ? <><a href="/admin/competicoes">Crie a liga ou uma copa</a>.</> : "Quem cuida de Competições cria a liga ou uma copa."}
          </p>
        ) : (
          <div className="rolagem">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Competição</th>
                  <th>Situação</th>
                  <th>Andamento</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dados.competicoes.map((c) => {
                  const pct = c.progresso.total ? Math.round((c.progresso.jogadas / c.progresso.total) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td>
                        {acesso.competicoes ? <a href={`/admin/competicoes/${c.id}`}>{c.nome}</a> : c.nome}
                        {!c.ativa && <span className="selo selo-cinza" style={{ marginLeft: 8 }}>Desativada</span>}
                      </td>
                      <td><Selo status={c.status} /></td>
                      <td style={{ minWidth: 200 }}>
                        {c.progresso.total ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="barra" style={{ flex: 1 }}><i style={{ width: `${pct}%` }} /></div>
                            <span className="num">{c.progresso.jogadas} de {c.progresso.total}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--apagado)" }}>Tabela ainda não gerada</span>
                        )}
                      </td>
                      <td className="acoes">
                        {acesso.resultados && c.progresso.total > 0 && (
                          <a className="btn btn-mini" href={`/admin/competicoes/${c.id}/partidas`}>Lançar resultados</a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Secao>
    </>
  );
}
