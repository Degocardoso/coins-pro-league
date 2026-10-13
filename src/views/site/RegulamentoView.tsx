// VIEW — aba "Regulamento": índice das seções e texto
import type { SiteController } from "@/controllers/SiteController";
import { lerMarkdown, Markdown } from "@/views/comum/Markdown";
import { formatarData } from "@/lib/datas";

type Dados = Awaited<ReturnType<SiteController["regulamento"]>>;

export function RegulamentoView({ dados }: { dados: Dados }) {
  const blocos = lerMarkdown(dados.regulamento.conteudo);
  const proibidos = lerMarkdown(dados.proibidos.conteudo);
  const secoes = blocos.filter((b) => b.tipo === "titulo" && b.nivel === 2) as { texto: string; id: string }[];
  if (!blocos.length) return <p className="vazio-site">O regulamento será publicado em breve.</p>;
  return (
    <div className="regulamento">
      <nav className="indice" aria-label="Seções do regulamento">
        <p>Seções</p>
        <ol>
          {secoes.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.texto}</a></li>)}
          {proibidos.length > 0 && <li><a href="#praticas-proibidas">Práticas proibidas</a></li>}
        </ol>
      </nav>
      <article className="texto-regulamento">
        <h1 className="titulo-liga" style={{ fontSize: "clamp(40px, 6vw, 64px)", marginBottom: 8 }}>Regulamento</h1>
        {dados.regulamento.atualizadoEm && (
          <p className="nota" style={{ marginBottom: 32 }}>Atualizado em {formatarData(dados.regulamento.atualizadoEm)}</p>
        )}
        <Markdown blocos={blocos} />
        {proibidos.length > 0 && (
          <>
            <h2 id="praticas-proibidas">Práticas proibidas</h2>
            <p>Lista citada na seção 12. A organização atualiza quando surge algo novo no jogo.</p>
            <Markdown blocos={proibidos} />
          </>
        )}
      </article>
    </div>
  );
}
