"use client";
// VIEW — texto pronto para copiar (posts de divulgação)
import { useState } from "react";

// Altura pela quantidade de linhas e pelo tamanho do texto (mensagem de chat é um parágrafo só), até 16 linhas
const linhas = (texto: string) =>
  Math.min(16, texto.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil([...l].length / 36)), 0) + 1);

export function CopiarTexto({ rotulo, texto }: { rotulo: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="copiar-texto">
      <div className="copiar-texto-topo">
        <strong>{rotulo}</strong>
        <button
          type="button"
          className="btn btn-mini btn-ouro"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            } catch {
              /* sem permissão: o texto continua selecionável */
            }
          }}
        >
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <textarea readOnly value={texto} rows={linhas(texto)} aria-label={`Texto para ${rotulo}`} onFocus={(e) => e.currentTarget.select()} />
    </div>
  );
}
