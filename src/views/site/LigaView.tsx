// VIEW — aba "A Liga": apresentação, destaque, ficha e clubes com elenco
import type { SiteController } from "@/controllers/SiteController";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { reais } from "@/lib/texto";
import { Moeda, PlacarDestaque } from "./pecas";
import { GradeClubes } from "./GradeClubes";

type Dados = Awaited<ReturnType<SiteController["aLiga"]>>;

function Chamada({ inscricoes }: { inscricoes: Dados["inscricoes"] }) {
  const aberta = inscricoes.find((i) => i.situacao.aberta);
  if (aberta && aberta.situacao.aberta) {
    const s = aberta.situacao;
    return (
      <div className="chamada">
        <a className="botao" href="/inscricao">Inscrever meu clube</a>
        <p>
          {s.soSubs ? <>Agora só para clubes com <strong>capitão sub do canal</strong>. </> : null}
          Inscrições da {aberta.competicao.nome}{" "}
          {s.fechaEm ? <>até <strong>{formatarDataHora(s.fechaEm)}</strong>.</> : "abertas."}
        </p>
      </div>
    );
  }
  const embreve = inscricoes.find((i) => !i.situacao.aberta && (i.situacao.abreEm || i.situacao.abreParaSubsEm));
  if (embreve && !embreve.situacao.aberta) {
    const s = embreve.situacao;
    return (
      <div className="chamada">
        <p>
          Inscrições da {embreve.competicao.nome} abrem em <strong>{formatarDataHora(s.abreParaSubsEm ?? s.abreEm)}</strong>
          {s.abreParaSubsEm && s.abreEm ? <> para subs do canal e em <strong>{formatarDataHora(s.abreEm)}</strong> para todos</> : null}.
        </p>
      </div>
    );
  }
  return (
    <div className="chamada">
      <a className="botao botao-sec" href="/tabela">Ver a tabela</a>
    </div>
  );
}

export function LigaView({ dados }: { dados: Dados }) {
  const p = dados.principal;
  if (!p)
    return (
      <section className="abertura">
        <div>
          <h1 className="titulo-liga"><b>Coin&apos;s</b> Pro League</h1>
          <p className="lead">A liga de Pro Clubs da comunidade thecoinsquash está sendo preparada. Volte em breve.</p>
        </div>
      </section>
    );
  const rodadas = p.tipo === "liga" ? 2 * (p.maxClubes - 1) : null;
  return (
    <>
      {dados.campeoes.map(({ competicao, clube }) => (
        <section key={competicao.id}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {competicao.bannerUrl && <img className="campeao-banner" src={competicao.bannerUrl} alt={`Banner do campeão: ${clube!.nome}`} />}
          <div className="campeao">
            <Moeda url={clube!.escudoUrl} nome={clube!.nome} tamanho="g" />
            <p>Campeão da {competicao.nome}<strong>{clube!.nome}</strong></p>
          </div>
        </section>
      ))}

      <section className="abertura">
        <div>
          <span className="rotulo">Liga de Pro Clubs {"//"} EA SPORTS FC 26</span>
          <h1 className="titulo-liga"><b>Coin&apos;s</b> Pro <span>League</span></h1>
          <p className="lead">
            A liga de Pro Clubs da comunidade thecoinsquash. EA SPORTS FC 26, com crossplay entre PS5, Xbox e PC.
          </p>
          <Chamada inscricoes={dados.inscricoes} />
        </div>
        {dados.destaque && (
          <PlacarDestaque jogo={dados.destaque.jogo} tipo={dados.destaque.tipo} competicao={dados.destaque.competicao.nome} />
        )}
      </section>

      <section className="bloco" aria-label="Ficha da competição">
        <dl className="ficha">
          <div>
            <dt>Formato</dt>
            <dd>{p.tipo === "liga" ? `${p.maxClubes} clubes, ida e volta, ${rodadas} rodadas` : `Mata-mata em jogo único, ${p.maxClubes} clubes`}</dd>
          </div>
          <div>
            <dt>Temporada</dt>
            <dd>{dados.temporada!.nome}{p.dataInicio ? `, a partir de ${formatarData(p.dataInicio)}` : ""}</dd>
          </div>
          <div>
            <dt>Inscrição</dt>
            <dd>{p.taxaCentavos ? reais(p.taxaCentavos) : "Gratuita"}</dd>
          </div>
          <div>
            <dt>Premiação</dt>
            <dd>{p.premio || "A anunciar"}</dd>
          </div>
        </dl>
      </section>

      <section className="bloco">
        <header>
          <h2>{dados.clubes.length ? `Os ${dados.clubes.length} clubes` : "Clubes"}</h2>
          {dados.clubes.length > 0 && <p className="nota">Toque em um clube para ver o elenco.</p>}
        </header>
        {dados.clubes.length === 0 ? (
          <p className="vazio-site">Os clubes aparecem aqui assim que as inscrições forem confirmadas.</p>
        ) : (
          <GradeClubes
            clubes={dados.clubes.map((c) => ({
              id: c.id,
              nome: c.nome,
              escudoUrl: c.escudoUrl,
              elenco: c.elenco.map((a) => ({ atletaId: a.atletaId, nome: a.nome, plataforma: a.plataforma, capitao: a.capitao })),
            }))}
          />
        )}
      </section>
    </>
  );
}
