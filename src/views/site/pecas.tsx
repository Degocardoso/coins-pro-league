// VIEW — peças reutilizadas nas abas do site
import type { JogoSite } from "@/controllers/SiteController";
import { formatarData, formatarDataHora, formatarDia, formatarHora } from "@/lib/datas";

export function Moeda({ url, nome, tamanho }: { url: string | null | undefined; nome: string; tamanho?: "p" | "g" }) {
  return (
    <span className={["moeda", tamanho ? `moeda-${tamanho}` : ""].join(" ").trim()} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url ? <img src={url} alt="" loading="lazy" /> : <span>{nome.slice(0, 1).toUpperCase()}</span>}
    </span>
  );
}

const encerrada = (j: { status: string }) => j.status === "finalizada" || j.status === "wo";

/** Placar de fliperama: próximo jogo (com horário) ou último resultado. */
export function PlacarDestaque({ jogo, tipo, competicao }: { jogo: JogoSite; tipo: "proximo" | "resultado"; competicao: string }) {
  const m = jogo.mandante ?? { nome: "A definir", escudoUrl: null };
  const v = jogo.visitante ?? { nome: "A definir", escudoUrl: null };
  return (
    <div className="placar-destaque tema-escuro-fixo" aria-label={tipo === "proximo" ? "Próximo jogo" : "Último resultado"}>
      <i className="canto-a" />
      <i className="canto-b" />
      <div className="placar-rotulo">
        <strong>{tipo === "proximo" ? "Próximo jogo" : "Último resultado"}</strong>
        <span>{competicao}</span>
      </div>
      <div className="placar-linha">
        <div className="placar-time"><Moeda url={m.escudoUrl} nome={m.nome} tamanho="g" /><strong>{m.nome}</strong></div>
        <div className="placar-numeros">
          {tipo === "resultado" ? (
            <>
              <span className="gol">{jogo.golsMandante}</span>
              <span className="x">×</span>
              <span className="gol">{jogo.golsVisitante}</span>
            </>
          ) : (
            <span className="hora">{formatarHora(jogo.dataHora)}</span>
          )}
        </div>
        <div className="placar-time"><Moeda url={v.escudoUrl} nome={v.nome} tamanho="g" /><strong>{v.nome}</strong></div>
      </div>
      <p className="placar-extra">
        {tipo === "proximo"
          ? formatarDia(jogo.dataHora)
          : jogo.penaltisMandante !== null
            ? `Nos pênaltis: ${jogo.penaltisMandante} × ${jogo.penaltisVisitante}`
            : formatarDataHora(jogo.dataHora)}
      </p>
    </div>
  );
}

/** Lista de jogos de uma rodada. */
export function ListaJogos({ jogos }: { jogos: JogoSite[] }) {
  return (
    <ul className="jogos">
      {jogos.map((j) => (
        <li key={j.id} className="jogo">
          <span className="lado m">
            <span>{j.mandante?.nome ?? "A definir"}</span>
            <Moeda url={j.mandante?.escudoUrl} nome={j.mandante?.nome ?? "?"} tamanho="p" />
          </span>
          <span className="meio">
            {encerrada(j) ? (
              <>
                <span className="resultado">{j.golsMandante} × {j.golsVisitante}</span>
                {j.status === "wo" && <span className="det">W.O.</span>}
                {j.penaltisMandante !== null && <span className="det">pên. {j.penaltisMandante} × {j.penaltisVisitante}</span>}
              </>
            ) : (
              <span className="quando">{j.dataHora ? formatarDataHora(j.dataHora) : "A combinar"}</span>
            )}
          </span>
          <span className="lado">
            <Moeda url={j.visitante?.escudoUrl} nome={j.visitante?.nome ?? "?"} tamanho="p" />
            <span>{j.visitante?.nome ?? "A definir"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type ItemRanking = { atletaId: number; valor: number; atleta: string; clube: { nome: string } };

export function Ranking({ titulo, itens, vazio }: { titulo: string; itens: ItemRanking[]; vazio: string }) {
  return (
    <section className="ranking">
      <h3>{titulo}</h3>
      {itens.length === 0 ? (
        <p className="vazio-site">{vazio}</p>
      ) : (
        <ol>
          {itens.map((i, n) => (
            <li key={i.atletaId}>
              <span className="n">{n + 1}</span>
              <span className="quem"><b>{i.atleta}</b><small>{i.clube.nome}</small></span>
              <span className="valor">{i.valor}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

type Noticia = { id: number; titulo: string; texto: string; imagemUrl: string | null; publicadaEm: Date };

export function Jornal({ noticias }: { noticias: Noticia[] }) {
  if (!noticias.length) return <p className="vazio-site">As primeiras notícias aparecem aqui quando a liga começar.</p>;
  return (
    <div className="jornal">
      {noticias.map((n) => (
        <article key={n.id} className="noticia">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {n.imagemUrl && <img src={n.imagemUrl} alt="" loading="lazy" />}
          <h3><a href={`/noticias/${n.id}`}>{n.titulo}</a></h3>
          <time dateTime={n.publicadaEm.toISOString()}>{formatarData(n.publicadaEm)}</time>
          <p>{n.texto}</p>
        </article>
      ))}
    </div>
  );
}
