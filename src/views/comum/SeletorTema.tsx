"use client";
// VIEW — botões Claro/Escuro. Guarda a escolha num cookie por 1 ano.
import { useEffect, useState } from "react";

type Tema = "claro" | "escuro";
export const COOKIE_TEMA = "cpl_tema";

export function SeletorTema({ className }: { className?: string }) {
  // Só sabemos o tema depois de montar (ele pode ter vindo do sistema, via script no <head>)
  const [tema, setTema] = useState<Tema | null>(null);
  useEffect(() => setTema(document.documentElement.dataset.tema === "claro" ? "claro" : "escuro"), []);

  const escolher = (t: Tema) => {
    document.documentElement.dataset.tema = t;
    document.cookie = `${COOKIE_TEMA}=${t}; path=/; max-age=31536000; samesite=lax`;
    setTema(t);
  };

  return (
    <div className={["tema", className].filter(Boolean).join(" ")} role="group" aria-label="Tema">
      <button type="button" aria-pressed={tema === "claro"} onClick={() => escolher("claro")}>Claro</button>
      <button type="button" aria-pressed={tema === "escuro"} onClick={() => escolher("escuro")}>Escuro</button>
    </div>
  );
}
