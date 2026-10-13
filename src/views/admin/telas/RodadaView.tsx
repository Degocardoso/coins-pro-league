// VIEW — rodadas (ou fases da copa) com horários e resultados
import { agendarPartida, definirPrazo } from "@/controllers/acoes/partida";
import type { PartidaController } from "@/controllers/PartidaController";
import { formatarDataHora, paraInputLocal } from "@/lib/datas";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Clube, Selo } from "../componentes";

type Dados = NonNullable<Awaited<ReturnType<PartidaController["rodada"]>>>;

export function RodadaView({ competicao, dados }: { competicao: { id: number; nome: string; tipo: string }; dados: Dados }) {
  const { atual } = dados;
  const base = `/admin/competicoes/${competicao.id}/partidas`;
  return (
    <>
      <Cabeca
        titulo={competicao.tipo === "liga" ? "Rodadas" : "Chave"}
        voltar={{ href: `/admin/competicoes/${competicao.id}`, rotulo: competicao.nome }}
        descricao="Registre o horário que os capitães combinaram e lance os resultados enviados no Discord."
      />
      <nav className="rodadas" aria-label="Rodadas">
        {dados.rodadas.map((r) => (
          <a
            key={r.id}
            href={`${base}?rodada=${r.numero}`}
            aria-current={r.id === atual.id ? "page" : undefined}
            className={r.pendentes === 0 ? "feita" : undefined}
            title={`${r.nome}: ${r.total - r.pendentes} de ${r.total} com resultado`}
          >
            {competicao.tipo === "liga" ? r.numero : r.nome}
          </a>
        ))}
      </nav>

      <section className="secao" style={{ marginTop: 0 }}>
        <h2>{atual.nome}</h2>
        <FormAcao acao={definirPrazo}>
          <input type="hidden" name="rodadaId" value={atual.id} />
          <input type="hidden" name="competicaoId" value={competicao.id} />
          <div className="linha-form" style={{ margin: "8px 0 18px" }}>
            <Campo rotulo="Prazo para jogar">
              <input type="datetime-local" name="prazo" defaultValue={paraInputLocal(atual.prazo)} />
            </Campo>
            <Enviar variante="normal">Salvar prazo</Enviar>
          </div>
        </FormAcao>

        <div className="rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Mandante</th>
                <th style={{ textAlign: "center" }}>Placar</th>
                <th>Visitante</th>
                <th>Data e hora combinadas</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {dados.partidas.map((p) => {
                const definida = p.mandante && p.visitante;
                const encerrada = p.status === "finalizada" || p.status === "wo";
                return (
                  <tr key={p.id}>
                    <td>{p.mandante ? <Clube nome={p.mandante.nome} escudoUrl={p.mandante.escudoUrl} /> : <span style={{ color: "var(--apagado)" }}>A definir</span>}</td>
                    <td style={{ textAlign: "center" }}>
                      {encerrada ? (
                        <span className="placar-mini">
                          {p.golsMandante} × {p.golsVisitante}
                          {p.penaltisMandante !== null && (
                            <small style={{ display: "block", fontSize: 12, color: "var(--apagado)", fontFamily: "var(--fonte-texto)" }}>
                              pênaltis {p.penaltisMandante} × {p.penaltisVisitante}
                            </small>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: "var(--apagado)" }}>×</span>
                      )}
                    </td>
                    <td>{p.visitante ? <Clube nome={p.visitante.nome} escudoUrl={p.visitante.escudoUrl} /> : <span style={{ color: "var(--apagado)" }}>A definir</span>}</td>
                    <td>
                      {encerrada ? (
                        <span style={{ color: "var(--apagado)" }}>{formatarDataHora(p.dataHora)}</span>
                      ) : definida ? (
                        <FormAcao acao={agendarPartida} semMensagem className="linha-form">
                          <input type="hidden" name="partidaId" value={p.id} />
                          <input type="hidden" name="competicaoId" value={competicao.id} />
                          <input type="datetime-local" name="dataHora" defaultValue={paraInputLocal(p.dataHora)} aria-label="Data e hora" />
                          <Enviar variante="normal" mini>Salvar</Enviar>
                        </FormAcao>
                      ) : null}
                    </td>
                    <td><Selo status={p.status} /></td>
                    <td className="acoes">
                      {definida && (
                        <a className={encerrada ? "btn btn-mini" : "btn btn-mini btn-ouro"} href={`/admin/partidas/${p.id}`}>
                          {encerrada ? "Editar resultado" : "Lançar resultado"}
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
