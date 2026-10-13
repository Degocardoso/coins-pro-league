"use client";
// VIEW — botão que abre um formulário numa janela (ex.: editar atleta). Fecha sozinho ao salvar.
import { createContext, useState, type ReactNode } from "react";
import { Dialogo } from "./Dialogo";

export const PopupContexto = createContext<{ fechar: () => void } | null>(null);

export function Popup({ rotulo, titulo, children, mini = true }: { rotulo: string; titulo: string; children: ReactNode; mini?: boolean }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button type="button" className={mini ? "btn btn-mini" : "btn"} onClick={() => setAberto(true)} aria-haspopup="dialog">
        {rotulo}
      </button>
      {aberto && (
        <PopupContexto.Provider value={{ fechar: () => setAberto(false) }}>
          <Dialogo titulo={titulo} aoFechar={() => setAberto(false)} largo>
            {children}
          </Dialogo>
        </PopupContexto.Provider>
      )}
    </>
  );
}
