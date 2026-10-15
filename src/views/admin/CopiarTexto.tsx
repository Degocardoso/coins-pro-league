"use client";
// VIEW — texto pronto para copiar (posts de divulgação)
import { useState } from "react";

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
      <textarea readOnly value={texto} rows={Math.min(16, texto.split("\n").length + 1)} aria-label={`Texto para ${rotulo}`} onFocus={(e) => e.currentTarget.select()} />
    </div>
  );
}
