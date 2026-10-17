"use client";
// VIEW — valor curto com botão de copiar (ex.: usuário do Discord do capitão)
import { useState } from "react";

export function CopiarCurto({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <span className="copiar-curto">
      <span>{valor}</span>
      <button
        type="button"
        className="btn btn-mini"
        aria-label={`Copiar ${rotulo}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(valor);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
          } catch {
            /* sem permissão: o texto continua selecionável */
          }
        }}
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </span>
  );
}
