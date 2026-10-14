"use client";
// VIEW — mostra um link do site e copia com um clique
import { useEffect, useState } from "react";

export function CopiarLink({ caminho, rotulo }: { caminho: string; rotulo: string }) {
  const [url, setUrl] = useState(caminho);
  const [copiado, setCopiado] = useState(false);
  useEffect(() => setUrl(window.location.origin + caminho), [caminho]);
  return (
    <div className="copiar-link">
      <span>{rotulo}</span>
      <div>
        <input type="text" readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label={rotulo} />
        <button
          type="button"
          className="btn btn-ouro"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              return; // navegador sem permissão: o link continua selecionável no campo
            }
            setCopiado(true);
            setTimeout(() => setCopiado(false), 2000);
          }}
        >
          {copiado ? "Copiado" : "Copiar link"}
        </button>
        <a className="btn" href={caminho} target="_blank" rel="noopener noreferrer">Abrir</a>
      </div>
    </div>
  );
}
