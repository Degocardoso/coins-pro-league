"use client";
// VIEW — grade dos clubes. O elenco abre num painel por cima da página,
// então a grade nunca muda de tamanho nem de lugar.
import { useEffect, useRef, useState } from "react";
import { Moeda } from "./pecas";

export type ClubeGrade = {
  id: number;
  nome: string;
  escudoUrl: string | null;
  elenco: { atletaId: number; nome: string; plataforma: string; capitao: boolean }[];
};

const PLATAFORMA: Record<string, string> = { ps5: "PS5", xbox: "Xbox", pc: "PC" };

export function GradeClubes({ clubes }: { clubes: ClubeGrade[] }) {
  const [aberto, setAberto] = useState<ClubeGrade | null>(null);
  const painel = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = painel.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  return (
    <>
      <div className="clubes">
        {clubes.map((c) => (
          <button key={c.id} type="button" className="clube-card" onClick={() => setAberto(c)} aria-haspopup="dialog">
            <Moeda url={c.escudoUrl} nome={c.nome} />
            <span className="clube-info">
              <span className="nome">{c.nome}</span>
              <span className="qtd">{c.elenco.length} atletas</span>
            </span>
            <span className="seta" aria-hidden>›</span>
          </button>
        ))}
      </div>

      <dialog
        ref={painel}
        className="painel-elenco"
        aria-labelledby="painel-elenco-titulo"
        onClose={() => setAberto(null)}
        onClick={(e) => e.target === e.currentTarget && setAberto(null)} // clique fora fecha
      >
        {aberto && (
          <div className="painel-conteudo">
            <header>
              <Moeda url={aberto.escudoUrl} nome={aberto.nome} tamanho="g" />
              <div>
                <h2 id="painel-elenco-titulo">{aberto.nome}</h2>
                <p>{aberto.elenco.length} atletas no elenco</p>
              </div>
              <button type="button" className="fechar" onClick={() => setAberto(null)} aria-label="Fechar">×</button>
            </header>
            <ul className="elenco">
              {aberto.elenco.map((a) => (
                <li key={a.atletaId}>
                  <span className="quem">{a.nome}</span>
                  {a.capitao && <span className="capitao">Capitão</span>}
                  <span className="plat">{PLATAFORMA[a.plataforma] ?? a.plataforma}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </dialog>
    </>
  );
}
