// VIEW — tela inicial do painel
import type { PainelController } from "@/controllers/PainelController";
import { Cabeca, Secao, Selo } from "../componentes";

type Dados = Awaited<ReturnType<PainelController["resumo"]>>;

export function PainelView({ dados }: { dados: Dados }) {
  if (!dados.temporada)
    return (
      <>
        <Cabeca titulo="Painel" />
        <p className="vazio">
          Nenhuma temporada ativa. <a href="/admin/temporada">Crie a primeira temporada</a> para começar.
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
      <Secao titulo="Competições da temporada">
        {dados.competicoes.length === 0 ? (
          <p className="vazio">
            Nenhuma competição ainda. <a href="/admin/competicoes">Crie a liga ou uma copa</a>.
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
                        <a href={`/admin/competicoes/${c.id}`}>{c.nome}</a>
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
                        {c.progresso.total > 0 && (
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
