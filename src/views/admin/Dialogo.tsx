"use client";
// VIEW — janela modal do painel (confirmação, aviso e edição). Usa <dialog> nativo:
// segura o foco dentro, fecha no Esc e devolve o foco ao botão que abriu.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Dialogo({
  titulo,
  children,
  aoFechar,
  largo,
}: {
  titulo: string;
  children: ReactNode;
  aoFechar: () => void;
  largo?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // Desenhada direto no <body>: assim não herda estilos de onde o botão está (célula de tabela, por exemplo)
  const [corpo, setCorpo] = useState<HTMLElement | null>(null);
  useEffect(() => setCorpo(document.body), []);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (!d.open) d.showModal();
    // Foco no botão seguro (Cancelar/Entendi) ou no primeiro campo, não no X
    const alvo = d.querySelector<HTMLElement>("[data-foco]") ?? d.querySelector<HTMLElement>("input:not([type=hidden]), select, textarea");
    alvo?.focus();
    return () => d.close();
  }, [corpo]);
  if (!corpo) return null;
  return createPortal(
    <dialog
      ref={ref}
      className={largo ? "dialogo dialogo-largo" : "dialogo"}
      aria-label={titulo}
      onCancel={(e) => {
        e.preventDefault();
        aoFechar();
      }}
      onClick={(e) => e.target === e.currentTarget && aoFechar()}
    >
      <div className="dialogo-conteudo">
        <header>
          <h2>{titulo}</h2>
          <button type="button" className="dialogo-fechar" onClick={aoFechar} aria-label="Fechar">×</button>
        </header>
        {children}
      </div>
    </dialog>,
    corpo,
  );
}

export function Confirmacao({
  mensagem,
  perigo,
  rotulo,
  aoConfirmar,
  aoCancelar,
}: {
  mensagem: string;
  perigo?: boolean;
  rotulo?: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}) {
  return (
    <Dialogo titulo={perigo ? "Tem certeza?" : "Confirmar"} aoFechar={aoCancelar}>
      <p className="dialogo-texto">{mensagem}</p>
      <div className="dialogo-acoes">
        <button type="button" className="btn" onClick={aoCancelar} data-foco>Cancelar</button>
        <button type="button" className={perigo ? "btn btn-perigo-cheio" : "btn btn-ouro"} onClick={aoConfirmar}>
          {rotulo ?? (perigo ? "Excluir" : "Confirmar")}
        </button>
      </div>
    </Dialogo>
  );
}

export function Aviso({ erros, alertas, aoFechar }: { erros: string[]; alertas: string[]; aoFechar: () => void }) {
  return (
    <Dialogo titulo={erros.length ? "Não deu para fazer isso" : "Atenção"} aoFechar={aoFechar}>
      {erros.length > 0 && <div className="msg msg-erro">{erros.length === 1 ? erros[0] : <ul>{erros.map((e) => <li key={e}>{e}</li>)}</ul>}</div>}
      {alertas.length > 0 && <div className="msg msg-alerta"><ul>{alertas.map((a) => <li key={a}>{a}</li>)}</ul></div>}
      <div className="dialogo-acoes">
        <button type="button" className="btn btn-ouro" onClick={aoFechar} data-foco>Entendi</button>
      </div>
    </Dialogo>
  );
}
