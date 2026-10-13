// VIEW — aba "Tabela": classificação (ou chave da copa), rodada, rankings e jornal
import type { SiteController } from "@/controllers/SiteController";
import { formatarDataHora } from "@/lib/datas";
import { vencedorDaPartida } from "@/controllers/regras/copa";
import { Jornal, ListaJogos, Moeda, Ranking } from "./pecas";

type Dados = Awaited<ReturnType<SiteController["tabela"]>>;
type Liga = Extract<Dados, { tipo: "liga" }>;
type Copa = Extract<Dados, { tipo: "copa" }>;

function Classificacao({ linhas }: { linhas: Liga["classificacao"] }) {
  return (
    <div className="rolagem-x">
      <table className="classificacao">
        <thead>
          <tr>
            <th scope="col"><span className="sr">Posição</span></th>
            <th scope="col">Clube</th>
            <th scope="col" title="Pontos">P</th>
            <th scope="col" title="Jogos">J</th>
            <th scope="col" title="Vitórias">V</th>
            <th scope="col" title="Empates">E</th>
            <th scope="col" title="Derrotas">D</th>
            <th scope="col" className="opc" title="Gols pró">GP</th>
            <th scope="col" className="opc" title="Gols contra">GC</th>
            <th scope="col" title="Saldo de gols">SG</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.clubeId} className={l.posicao === 1 && l.jogos > 0 ? "lider" : undefined}>
              <td className="pos">{l.posicao}</td>
              <td>
                <span className="clube-cel">
                  <Moeda url={l.clube.escudoUrl} nome={l.clube.nome} tamanho="p" />
                  {l.clube.nome}
                  {l.precisaSorteio && <span className="sorteio">empate total</span>}
                </span>
              </td>
              <td className="pts">{l.pontos}</td>
              <td>{l.jogos}</td>
              <td>{l.vitorias}</td>
              <td>{l.empates}</td>
              <td>{l.derrotas}</td>
              <td className="opc">{l.golsPro}</td>
              <td className="opc">{l.golsContra}</td>
              <td>{l.saldo > 0 ? `+${l.saldo}` : l.saldo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rodada({ dados, competicaoId }: { dados: Liga; competicaoId: number }) {
  const r = dados.rodada;
  if (!r) return <p className="vazio-site">A tabela de jogos sai quando as inscrições fecharem.</p>;
  const numero = r.atual.numero;
  const total = r.rodadas.length;
  const link = (n: number) => `/tabela?c=${competicaoId}&rodada=${n}`;
  return (
    <section className="bloco">
      <header>
        <div>
          <h2>{r.atual.nome}</h2>
          {r.atual.prazo && <p className="nota">Prazo para jogar: {formatarDataHora(r.atual.prazo)}</p>}
        </div>
        <nav className="rodada-nav" aria-label="Trocar de rodada">
          {numero > 1 ? <a href={link(numero - 1)} aria-label="Rodada anterior">‹</a> : <span aria-hidden>‹</span>}
          {numero < total ? <a href={link(numero + 1)} aria-label="Próxima rodada">›</a> : <span aria-hidden>›</span>}
        </nav>
      </header>
      <ListaJogos
        jogos={[...r.partidas].sort(
          (a, b) => (a.dataHora?.getTime() ?? Infinity) - (b.dataHora?.getTime() ?? Infinity) || a.ordem - b.ordem,
        )}
      />
      {dados.suspensos.length > 0 && (
        <p className="suspensos">
          <strong>Suspensos nesta rodada:</strong> {dados.suspensos.map((s) => `${s.atleta} (${s.clube})`).join(", ")}
        </p>
      )}
    </section>
  );
}

function Chave({ dados }: { dados: Copa }) {
  if (!dados.fases.length) return <p className="vazio-site">A chave sai depois do sorteio.</p>;
  return (
    <div className="chave">
      {dados.fases.map((f) => (
        <section key={f.numero} className="fase">
          <h3>{f.nome}</h3>
          <div className="fase-jogos">
            {f.jogos.map((j) => {
              const definido = j.mandanteId && j.visitanteId;
              const vencedor = definido && (j.status === "finalizada" || j.status === "wo")
                ? vencedorDaPartida({ ...j, mandanteId: j.mandanteId!, visitanteId: j.visitanteId! })
                : null;
              const lado = (clube: typeof j.mandante, id: number | null, gols: number | null) => (
                <div className={!clube ? "indef" : vencedor === id ? "venceu" : undefined}>
                  <Moeda url={clube?.escudoUrl} nome={clube?.nome ?? "?"} tamanho="p" />
                  <span className="nome">{clube?.nome ?? "A definir"}</span>
                  {vencedor !== null || j.status === "wo" ? <span className="g">{gols}</span> : null}
                </div>
              );
              return (
                <div key={j.id} className="confronto">
                  {lado(j.mandante, j.mandanteId, j.golsMandante)}
                  {lado(j.visitante, j.visitanteId, j.golsVisitante)}
                  {j.penaltisMandante !== null ? (
                    <small>Pênaltis: {j.penaltisMandante} × {j.penaltisVisitante}</small>
                  ) : j.status === "agendada" && j.dataHora ? (
                    <small>{formatarDataHora(j.dataHora)}</small>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export function TabelaView({ dados }: { dados: Dados }) {
  if (!dados.atual)
    return <p className="vazio-site">A tabela aparece aqui quando a primeira competição começar.</p>;
  const c = dados.atual;
  return (
    <>
      {dados.competicoes.length > 1 && (
        <nav className="seletor-comp" aria-label="Competições">
          {dados.competicoes.map((x) => (
            <a key={x.id} href={`/tabela?c=${x.id}`} aria-current={x.id === c.id ? "page" : undefined}>{x.nome}</a>
          ))}
        </nav>
      )}
      {dados.campeao && (
        <div className="campeao">
          <Moeda url={dados.campeao.escudoUrl} nome={dados.campeao.nome} tamanho="g" />
          <p>Campeão da {c.nome}<strong>{dados.campeao.nome}</strong></p>
        </div>
      )}
      <div className="grade-tabela">
        <div>
          <section className="bloco">
            <header><h2>{dados.tipo === "liga" ? "Classificação" : "Chave"}</h2></header>
            {dados.tipo === "liga" ? <Classificacao linhas={dados.classificacao} /> : <Chave dados={dados} />}
          </section>
          {dados.tipo === "liga" && <Rodada dados={dados} competicaoId={c.id} />}
          <section className="bloco">
            <header><h2>Destaques individuais</h2></header>
            <div className="rankings">
              <Ranking titulo="Artilharia" itens={dados.rankings.artilharia} vazio="Nenhum gol ainda." />
              <Ranking titulo="Assistências" itens={dados.rankings.assistencias} vazio="Nenhuma assistência ainda." />
              <Ranking titulo="MVP" itens={dados.rankings.mvp} vazio="Nenhum MVP ainda." />
              <Ranking titulo="Gols de pênalti" itens={dados.rankings.penaltis} vazio="Nenhum gol de pênalti ainda." />
              <Ranking titulo="Jogos sem sofrer gol" itens={dados.rankings.semSofrerGol} vazio="Nenhum goleiro sem sofrer gol ainda." />
            </div>
          </section>
        </div>
        <aside>
          <section className="bloco">
            <header><h2>Jornal da liga</h2></header>
            <Jornal noticias={dados.noticias} />
            {dados.noticias.length > 0 && <p className="ver-jornal"><a href="/noticias">Ler o jornal completo</a></p>}
          </section>
        </aside>
      </div>
    </>
  );
}
