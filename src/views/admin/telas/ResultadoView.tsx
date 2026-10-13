// VIEW — lançamento de resultado: placar, desempate da copa, estatísticas e W.O.
import { aplicarWO, desfazerResultado, lancarResultado } from "@/controllers/acoes/partida";
import type { PartidaController } from "@/controllers/PartidaController";
import { formatarDataHora } from "@/lib/datas";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Escudo, Secao, Selo } from "../componentes";

type Dados = NonNullable<Awaited<ReturnType<PartidaController["paraResultado"]>>>;
type Lado = NonNullable<Dados["lados"]>["mandante"];
type Est = Dados["estatisticas"][number];

const PLATAFORMA: Record<string, string> = { ps5: "PS5", xbox: "Xbox", pc: "PC" };

function TabelaAtletas({ lado, estatisticas }: { lado: Lado; estatisticas: Map<number, Est> }) {
  const clubeId = lado.clube.id;
  const temGoleiroHumano = lado.atletas.some((a) => estatisticas.get(a.id)?.goleiro);
  return (
    <div>
      <h3>
        <Escudo url={lado.clube.escudoUrl} nome={lado.clube.nome} /> {lado.clube.nome}
      </h3>
      <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr>
              <th>Atleta</th>
              <th title="Entrou em campo">Jogou</th>
              <th className="num">Gols</th>
              <th className="num" title="Quantos dos gols foram de pênalti">Pênalti</th>
              <th className="num">Assist.</th>
              <th title="Goleiro humano da partida">Goleiro</th>
              <th>MVP</th>
              <th title="Cartão vermelho">Verm.</th>
            </tr>
          </thead>
          <tbody>
            {lado.atletas.map((a) => {
              const e = estatisticas.get(a.id);
              return (
                <tr key={a.id}>
                  <td>
                    <input type="hidden" name="atleta" value={`${a.id}:${clubeId}`} />
                    {a.nomePersonagem}
                    <span className="plataforma">{PLATAFORMA[a.plataforma]}</span>
                    {a.suspenso && <span className="aviso-linha">Suspenso nesta partida</span>}
                    {!a.inscrito && <span className="aviso-linha">Fora do elenco na data do jogo</span>}
                  </td>
                  <td><input type="checkbox" name={`jogou_${a.id}`} defaultChecked={!!e} aria-label={`${a.nomePersonagem} jogou`} /></td>
                  <td className="num"><input type="number" name={`gols_${a.id}`} min={0} defaultValue={e?.gols || ""} aria-label="Gols" /></td>
                  <td className="num"><input type="number" name={`pen_${a.id}`} min={0} defaultValue={e?.golsPenalti || ""} aria-label="Gols de pênalti" /></td>
                  <td className="num"><input type="number" name={`ast_${a.id}`} min={0} defaultValue={e?.assistencias || ""} aria-label="Assistências" /></td>
                  <td><input type="radio" name={`goleiro_${clubeId}`} value={a.id} defaultChecked={!!e?.goleiro} aria-label="Goleiro" /></td>
                  <td><input type="radio" name="mvp" value={a.id} defaultChecked={!!e?.mvp} aria-label="MVP" /></td>
                  <td><input type="checkbox" name={`verm_${a.id}`} defaultChecked={!!e?.cartaoVermelho} aria-label="Cartão vermelho" /></td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={5} style={{ color: "var(--apagado)" }}>Goleiro da IA</td>
              <td><input type="radio" name={`goleiro_${clubeId}`} value="" defaultChecked={!temGoleiroHumano} aria-label="Goleiro da IA" /></td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ResultadoView({ dados, desfeito }: { dados: Dados; desfeito?: boolean }) {
  const { partida: p, competicao, rodada, lados } = dados;
  const voltar = { href: `/admin/competicoes/${competicao.id}/partidas?rodada=${rodada.numero}`, rotulo: `${competicao.nome}, ${rodada.nome}` };
  if (!lados)
    return (
      <>
        <Cabeca titulo="Partida a definir" voltar={voltar} />
        <p className="vazio">Os dois clubes desta partida ainda não estão definidos. Lance o resultado da fase anterior primeiro.</p>
      </>
    );
  const copa = competicao.tipo === "copa";
  const encerrada = p.status === "finalizada" || p.status === "wo";
  const estatisticas = new Map(dados.estatisticas.map((e) => [e.atletaId, e]));
  const nomeM = lados.mandante.clube.nome;
  const nomeV = lados.visitante.clube.nome;

  return (
    <>
      <Cabeca
        titulo={`${nomeM} × ${nomeV}`}
        voltar={voltar}
        descricao={
          <>
            <Selo status={p.status} /> {p.dataHora ? `Jogo de ${formatarDataHora(p.dataHora)}.` : "Sem horário registrado."}{" "}
            Marque só os atletas humanos. Quem tiver gol, assistência ou outro número preenchido já conta como “jogou”.
          </>
        }
      />
      {desfeito && !encerrada && <div className="msg msg-ok" style={{ margin: "-10px 0 18px" }}>Resultado desfeito: a partida voltou a ficar sem resultado.</div>}
      <FormAcao acao={lancarResultado}>
        <input type="hidden" name="partidaId" value={p.id} />
        <input type="hidden" name="competicaoId" value={competicao.id} />
        <div className="placar tema-escuro-fixo">
          <i className="canto-a" />
          <i className="canto-b" />
          <div className="placar-time">
            <Escudo url={lados.mandante.clube.escudoUrl} nome={nomeM} />
            <strong>{nomeM}</strong>
          </div>
          <div className="placar-gols">
            <input type="number" name="golsMandante" min={0} required defaultValue={encerrada && p.wo === null ? p.golsMandante ?? "" : ""} aria-label={`Gols do ${nomeM}`} />
            <span className="x">×</span>
            <input type="number" name="golsVisitante" min={0} required defaultValue={encerrada && p.wo === null ? p.golsVisitante ?? "" : ""} aria-label={`Gols do ${nomeV}`} />
          </div>
          <div className="placar-time visitante">
            <Escudo url={lados.visitante.clube.escudoUrl} nome={nomeV} />
            <strong>{nomeV}</strong>
          </div>
        </div>
        {copa && (
          <div className="desempate">
            <label className="marcar"><input type="checkbox" name="prorrogacao" defaultChecked={p.prorrogacao} /> Teve prorrogação (o placar acima já inclui os gols dela)</label>
            <span style={{ color: "var(--apagado)" }}>Pênaltis, se empatou:</span>
            <input type="number" name="penaltisMandante" min={0} defaultValue={p.penaltisMandante ?? ""} aria-label={`Pênaltis do ${nomeM}`} />
            <span>×</span>
            <input type="number" name="penaltisVisitante" min={0} defaultValue={p.penaltisVisitante ?? ""} aria-label={`Pênaltis do ${nomeV}`} />
          </div>
        )}
        <div className="grade-atletas">
          <TabelaAtletas lado={lados.mandante} estatisticas={estatisticas} />
          <TabelaAtletas lado={lados.visitante} estatisticas={estatisticas} />
        </div>
        <div className="linha-form" style={{ marginTop: 18 }}>
          <Enviar>{encerrada ? "Salvar correção" : "Salvar resultado"}</Enviar>
          <label className="marcar" style={{ color: "var(--apagado)" }}><input type="radio" name="mvp" value="" /> Partida sem MVP</label>
        </div>
      </FormAcao>

      <Secao titulo="W.O." dica="Vale 3x0 e apaga as estatísticas desta partida. No W.O. duplo, os dois clubes perdem.">
        <FormAcao acao={aplicarWO} perigo rotuloConfirmar="Aplicar W.O." confirmar="Aplicar o W.O.? As estatísticas lançadas nesta partida serão apagadas.">
          <input type="hidden" name="partidaId" value={p.id} />
          <input type="hidden" name="competicaoId" value={competicao.id} />
          <div className="linha-form">
            <Campo rotulo="Resultado do W.O.">
              <select name="tipo" required defaultValue={p.wo ?? ""}>
                <option value="" disabled>Escolha</option>
                <option value="mandante_vence">{nomeM} vence</option>
                <option value="visitante_vence">{nomeV} vence</option>
                <option value="duplo">W.O. duplo</option>
              </select>
            </Campo>
            <Enviar variante="perigo">Aplicar W.O.</Enviar>
          </div>
        </FormAcao>
      </Secao>

      {encerrada && (
        <Secao titulo="Desfazer resultado" dica="Volta a partida para “sem resultado”: apaga o placar, as estatísticas e as suspensões geradas por ela.">
          <FormAcao
            acao={desfazerResultado}
            perigo
            rotuloConfirmar="Desfazer"
            confirmar={`Desfazer o resultado de ${nomeM} × ${nomeV}? O placar e as estatísticas desta partida serão apagados.`}
          >
            <input type="hidden" name="partidaId" value={p.id} />
            <input type="hidden" name="competicaoId" value={competicao.id} />
            <Enviar variante="perigo">Desfazer resultado</Enviar>
          </FormAcao>
        </Secao>
      )}
    </>
  );
}
