// VIEW — textos editáveis: regulamento e práticas proibidas
import { carregarRegulamentoOficial, salvarPagina } from "@/controllers/acoes/pagina";
import { formatarDataHora } from "@/lib/datas";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Secao } from "../componentes";

type Pagina = { slug: string; titulo: string; conteudo: string; atualizadoEm: Date | null };

function Editor({ pagina, linhas }: { pagina: Pagina; linhas: number }) {
  return (
    <FormAcao acao={salvarPagina}>
      <input type="hidden" name="slug" value={pagina.slug} />
      <textarea name="conteudo" defaultValue={pagina.conteudo} rows={linhas} style={{ width: "100%", boxSizing: "border-box", fontSize: 14 }} aria-label={pagina.titulo} />
      <div className="linha-form" style={{ marginTop: 10 }}>
        <Enviar>Salvar</Enviar>
        {pagina.atualizadoEm && <span style={{ color: "var(--apagado)", fontSize: 13 }}>Última alteração em {formatarDataHora(pagina.atualizadoEm)}</span>}
      </div>
    </FormAcao>
  );
}

export function RegulamentoView({ regulamento, proibidos }: { regulamento: Pagina; proibidos: Pagina }) {
  return (
    <>
      <Cabeca titulo="Regulamento" descricao="Texto em Markdown: ## para títulos de seção, 1. para itens numerados. É o que aparece na aba Regulamento do site." />
      <Secao titulo="Regulamento oficial" dica="Datas, taxa e prêmio não ficam aqui: eles vêm da ficha de cada competição.">
        <Editor pagina={regulamento} linhas={24} />
        <FormAcao acao={carregarRegulamentoOficial} rotuloConfirmar="Substituir" confirmar="Substituir o texto atual pelo regulamento aprovado? O que estiver no editor será trocado.">
          <p style={{ marginTop: 14 }}><Enviar variante="normal">Carregar o regulamento aprovado</Enviar></p>
        </FormAcao>
      </Secao>
      <Secao titulo="Práticas proibidas" dica="Lista de bugs e exploits proibidos, citada na seção 12. Atualize quando surgir algo novo no jogo.">
        <Editor pagina={proibidos} linhas={8} />
      </Secao>
    </>
  );
}
