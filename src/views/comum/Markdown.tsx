// VIEW — Markdown simples para o regulamento: ## títulos, listas 1. e -, parágrafos e **negrito**.
// Monta elementos React (sem HTML cru), então nada digitado no admin vira código na página.
import { Fragment, type ReactNode } from "react";
import { slugificar } from "@/lib/texto";

type Bloco =
  | { tipo: "titulo"; nivel: 2 | 3; texto: string; id: string }
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "lista"; ordenada: boolean; itens: string[] };

export function lerMarkdown(md: string): Bloco[] {
  const blocos: Bloco[] = [];
  let paragrafo: string[] = [];
  let lista: { ordenada: boolean; itens: string[] } | null = null;
  const fecharParagrafo = () => {
    if (paragrafo.length) blocos.push({ tipo: "paragrafo", texto: paragrafo.join(" ") });
    paragrafo = [];
  };
  const fecharLista = () => {
    if (lista) blocos.push({ tipo: "lista", ...lista });
    lista = null;
  };
  for (const bruta of md.replace(/\r\n/g, "\n").split("\n")) {
    const linha = bruta.trim();
    const titulo = /^(#{2,3})\s+(.+)$/.exec(linha);
    const ordenado = /^\d+[.)]\s+(.+)$/.exec(linha);
    const marcador = /^[-*]\s+(.+)$/.exec(linha);
    if (!linha) {
      fecharParagrafo();
      fecharLista();
    } else if (titulo) {
      fecharParagrafo();
      fecharLista();
      blocos.push({ tipo: "titulo", nivel: titulo[1].length as 2 | 3, texto: titulo[2], id: slugificar(titulo[2]) });
    } else if (ordenado || marcador) {
      fecharParagrafo();
      const ordenada = !!ordenado;
      if (lista && lista.ordenada !== ordenada) fecharLista();
      lista ??= { ordenada, itens: [] };
      lista.itens.push((ordenado ?? marcador)![1]);
    } else if (lista && /^\s{2,}/.test(bruta)) {
      lista.itens[lista.itens.length - 1] += " " + linha; // continuação do item
    } else {
      fecharLista();
      paragrafo.push(linha);
    }
  }
  fecharParagrafo();
  fecharLista();
  return blocos;
}

function Inline({ texto }: { texto: string }) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

export function Markdown({ blocos }: { blocos: Bloco[] }): ReactNode {
  return blocos.map((b, i) => {
    if (b.tipo === "titulo")
      return b.nivel === 2 ? <h2 key={i} id={b.id}><Inline texto={b.texto} /></h2> : <h3 key={i} id={b.id}><Inline texto={b.texto} /></h3>;
    if (b.tipo === "paragrafo") return <p key={i}><Inline texto={b.texto} /></p>;
    const Lista = b.ordenada ? "ol" : "ul";
    return (
      <Lista key={i}>
        {b.itens.map((item, j) => <li key={j}><Inline texto={item} /></li>)}
      </Lista>
    );
  });
}
