// VIEW — aba Notícias: capa do jornal e página de cada notícia
import type { JornalController } from "@/controllers/JornalController";
import { formatarData, formatarDataLonga } from "@/lib/datas";
import { resumir } from "@/lib/texto";

type Capa = Awaited<ReturnType<JornalController["capa"]>>;
type Materia = NonNullable<Awaited<ReturnType<JornalController["noticia"]>>>;
type Noticia = Capa["demais"][number];

/** Texto da notícia: linha em branco separa parágrafos. */
export function Paragrafos({ texto, capitular }: { texto: string; capitular?: boolean }) {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((p, i) => <p key={i} className={capitular && i === 0 ? "capitular" : undefined}>{p}</p>);
}

function Cabecalho({ data, temporada }: { data: Date | null; temporada: string | null }) {
  return (
    <header className="expediente">
      <h1>Jornal da Liga</h1>
      <p>
        <span>Coin&apos;s Pro League{temporada ? `, ${temporada}` : ""}</span>
        {data && <span>Edição de {formatarDataLonga(data)}</span>}
      </p>
    </header>
  );
}

function Imagem({ url, alt = "" }: { url: string | null; alt?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt={alt} loading="lazy" /> : null;
}

/** Na capa, só o resumo: o texto inteiro fica na página da notícia. */
function Resumo({ n, limite, capitular }: { n: Noticia; limite: number; capitular?: boolean }) {
  const r = resumir(n.texto, limite);
  return (
    <div className="corpo">
      {r.paragrafos.map((p, i) => <p key={i} className={capitular && i === 0 ? "capitular" : undefined}>{p}</p>)}
      {r.cortado && <p className="continuar"><a href={`/noticias/${n.id}`}>Ler a notícia completa</a></p>}
    </div>
  );
}

function Nota({ n }: { n: Noticia }) {
  return (
    <article className="nota-jornal">
      <a href={`/noticias/${n.id}`} tabIndex={-1} aria-hidden><Imagem url={n.imagemUrl} /></a>
      <h3><a href={`/noticias/${n.id}`}>{n.titulo}</a></h3>
      <time dateTime={n.publicadaEm.toISOString()}>{formatarData(n.publicadaEm)}</time>
      <Resumo n={n} limite={200} />
    </article>
  );
}

export function JornalView({ capa }: { capa: Capa }) {
  const { manchete } = capa;
  return (
    <div className="jornal-pagina">
      <Cabecalho data={manchete?.publicadaEm ?? null} temporada={capa.temporada} />
      {!manchete ? (
        <p className="vazio-site jornal-vazio">Nenhuma notícia publicada ainda. A primeira edição sai junto com a liga.</p>
      ) : (
        <>
          <article className={manchete.imagemUrl ? "manchete com-imagem" : "manchete"}>
            <h2><a href={`/noticias/${manchete.id}`}>{manchete.titulo}</a></h2>
            <div className="manchete-corpo">
              {manchete.imagemUrl && <a href={`/noticias/${manchete.id}`} tabIndex={-1} aria-hidden><Imagem url={manchete.imagemUrl} /></a>}
              <div>
                <time dateTime={manchete.publicadaEm.toISOString()}>{formatarData(manchete.publicadaEm)}</time>
                <Resumo n={manchete} limite={manchete.imagemUrl ? 340 : 520} capitular />
              </div>
            </div>
          </article>
          {capa.demais.length > 0 && <div className="colunas-jornal">{capa.demais.map((n) => <Nota key={n.id} n={n} />)}</div>}
          {capa.paginas > 1 && (
            <nav className="edicoes" aria-label="Edições">
              {capa.pagina > 1 ? <a href={capa.pagina === 2 ? "/noticias" : `/noticias?pagina=${capa.pagina - 1}`}>Notícias mais recentes</a> : <span />}
              <span>Página {capa.pagina} de {capa.paginas}</span>
              {capa.pagina < capa.paginas ? <a href={`/noticias?pagina=${capa.pagina + 1}`}>Edições anteriores</a> : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export function MateriaView({ dados, temporada }: { dados: Materia; temporada: string | null }) {
  const { noticia: n, mais } = dados;
  return (
    <div className="jornal-pagina">
      <Cabecalho data={null} temporada={temporada} />
      <article className="materia">
        <h2>{n.titulo}</h2>
        <time dateTime={n.publicadaEm.toISOString()}>{formatarDataLonga(n.publicadaEm)}</time>
        <Imagem url={n.imagemUrl} alt="" />
        <div className="corpo"><Paragrafos texto={n.texto} capitular /></div>
      </article>
      {mais.length > 0 && (
        <section className="mais-jornal">
          <h3>Mais do jornal</h3>
          <ul>
            {mais.map((m) => (
              <li key={m.id}>
                <a href={`/noticias/${m.id}`}>{m.titulo}</a>
                <time dateTime={m.publicadaEm.toISOString()}>{formatarData(m.publicadaEm)}</time>
              </li>
            ))}
          </ul>
          <p><a href="/noticias">Ver todas as notícias</a></p>
        </section>
      )}
    </div>
  );
}
