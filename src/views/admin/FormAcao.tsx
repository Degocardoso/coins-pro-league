"use client";
// VIEW — formulário ligado a uma ação do servidor, com mensagem de retorno.
// Envia por onSubmit (e não por action={...}) para o React não apagar o que foi
// digitado quando a ação devolve erro. Só limpa os campos se limparAoSalvar.
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import type { Estado } from "@/controllers/acoes/estado";

type Acao = (estado: Estado, form: FormData) => Promise<Estado>;

const Pendente = createContext(false);

export function FormAcao({
  acao,
  children,
  className,
  confirmar,
  semMensagem,
  limparAoSalvar,
}: {
  acao: Acao;
  children: ReactNode;
  className?: string;
  confirmar?: string;
  semMensagem?: boolean;
  limparAoSalvar?: boolean;
}) {
  const [estado, executar, pendente] = useActionState(acao, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (limparAoSalvar && estado?.ok && !estado.erros?.length) form.current?.reset();
  }, [estado, limparAoSalvar]);

  return (
    <form
      ref={form}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (pendente || (confirmar && !window.confirm(confirmar))) return;
        const dados = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => executar(dados));
      }}
    >
      <Pendente.Provider value={pendente}>{children}</Pendente.Provider>
      {!semMensagem && <Mensagem estado={estado} />}
    </form>
  );
}

export function Mensagem({ estado }: { estado: Estado }) {
  if (!estado) return null;
  return (
    <div aria-live="polite">
      {estado.erros?.length ? (
        <div className="msg msg-erro">
          {estado.erros.length === 1 ? estado.erros[0] : <ul>{estado.erros.map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      ) : null}
      {estado.ok && <div className="msg msg-ok">{estado.ok}</div>}
      {estado.alertas?.length ? (
        <div className="msg msg-alerta">
          <ul>{estado.alertas.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      ) : null}
    </div>
  );
}

export function Enviar({
  children,
  variante = "ouro",
  nome,
  valor,
  mini,
}: {
  children: ReactNode;
  variante?: "ouro" | "normal" | "perigo";
  nome?: string;
  valor?: string;
  mini?: boolean;
}) {
  const pendente = useContext(Pendente);
  const classe = ["btn", variante === "ouro" ? "btn-ouro" : variante === "perigo" ? "btn-perigo" : "", mini ? "btn-mini" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="submit" className={classe} disabled={pendente} aria-busy={pendente} name={nome} value={valor}>
      {pendente ? "Salvando…" : children}
    </button>
  );
}
