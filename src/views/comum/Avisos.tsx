"use client";
// VIEW — avisos flutuantes de confirmação ("Resultado salvo.", "Atleta liberado.").
// Aparecem no canto de baixo e somem sozinhos: a tela não pula para o topo para mostrar a confirmação.
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type Aviso = { id: number; texto: string };
export const AvisosContexto = createContext<{ avisar: (texto: string) => void } | null>(null);

const DURACAO_MS = 5000;

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const proximo = useRef(1);
  const tirar = useCallback((id: number) => setAvisos((a) => a.filter((x) => x.id !== id)), []);
  const avisar = useCallback((texto: string) => {
    const id = proximo.current++;
    setAvisos((a) => [...a.slice(-2), { id, texto }]); // no máximo 3 na tela
  }, []);
  // Valor estável: quem usa o contexto não é redesenhado a cada aviso que entra ou sai
  const valor = useMemo(() => ({ avisar }), [avisar]);
  return (
    <AvisosContexto.Provider value={valor}>
      {children}
      <div className="avisos-flutuantes" role="status" aria-live="polite">
        {avisos.map((a) => (
          <AvisoFlutuante key={a.id} aviso={a} tirar={tirar} />
        ))}
      </div>
    </AvisosContexto.Provider>
  );
}

function AvisoFlutuante({ aviso, tirar }: { aviso: Aviso; tirar: (id: number) => void }) {
  // O tempo conta uma vez, a partir de quando o aviso aparece
  useEffect(() => {
    const t = setTimeout(() => tirar(aviso.id), DURACAO_MS);
    return () => clearTimeout(t);
  }, [aviso.id, tirar]);
  return (
    <div className="aviso-flutuante">
      <span className="aviso-flutuante-icone" aria-hidden>✓</span>
      <p>{aviso.texto}</p>
      <button type="button" onClick={() => tirar(aviso.id)} aria-label="Fechar aviso">×</button>
    </div>
  );
}
