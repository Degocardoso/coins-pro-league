"use client";
// VIEW — formulário ligado a uma ação do servidor, com mensagem de retorno.
// - Envia por onSubmit (e não por action={...}) para o React não apagar o que foi digitado quando dá erro.
// - "confirmar" abre a janela de confirmação do painel antes de enviar.
// - "semMensagem" (botões em tabela): sucesso fica silencioso; erro e alerta abrem numa janela.
// - Dentro de um <Popup>, a janela fecha sozinha quando salva.
// - Sucesso aparece no aviso flutuante (canto de baixo), sem a tela pular; erros ficam junto do formulário.
import { createContext, startTransition, useActionState, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Estado } from "@/controllers/acoes/estado";
import { AvisosContexto } from "@/views/comum/Avisos";
import { Aviso, Confirmacao } from "./Dialogo";
import { PopupContexto } from "./Popup";

type Acao = (estado: Estado, form: FormData) => Promise<Estado>;

const Pendente = createContext(false);

export function FormAcao({
  acao,
  children,
  className,
  confirmar,
  perigo,
  rotuloConfirmar,
  semMensagem,
  limparAoSalvar,
}: {
  acao: Acao;
  children: ReactNode;
  className?: string;
  confirmar?: string;
  perigo?: boolean;
  rotuloConfirmar?: string;
  semMensagem?: boolean;
  limparAoSalvar?: boolean;
}) {
  // O aviso de sucesso sai no instante em que a resposta chega: se a tela nova não tiver mais este
  // formulário (ex.: "Desfazer resultado" some junto com a seção), o aviso aparece do mesmo jeito.
  const avisos = useContext(AvisosContexto);
  const avisosRef = useRef(avisos);
  avisosRef.current = avisos;
  const [estado, executar, pendente] = useActionState(async (anterior: Estado, dados: FormData) => {
    const resposta = await acao(anterior, dados);
    if (resposta?.ok && !resposta.erros?.length) avisosRef.current?.avisar(resposta.ok);
    return resposta;
  }, null);
  const form = useRef<HTMLFormElement>(null);
  const [aguardando, setAguardando] = useState<FormData | null>(null);
  const [aviso, setAviso] = useState(false);
  const popup = useContext(PopupContexto);

  // Cada resposta do servidor é tratada uma vez só (aviso, fechar janela, limpar campos)
  const tratado = useRef<Estado>(null);
  useEffect(() => {
    if (!estado || estado === tratado.current) return;
    tratado.current = estado;
    const temProblema = !!estado.erros?.length || !!estado.alertas?.length;
    if (semMensagem && temProblema) setAviso(true);
    if (estado.ok && !estado.erros?.length) {
      if (limparAoSalvar) form.current?.reset();
      if (popup && !estado.alertas?.length) popup.fechar();
    }
  }, [estado, semMensagem, limparAoSalvar, popup]);

  const enviar = (dados: FormData) => startTransition(() => executar(dados));

  return (
    <form
      ref={form}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (pendente) return;
        const dados = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        if (confirmar) setAguardando(dados);
        else enviar(dados);
      }}
    >
      <Pendente.Provider value={pendente}>{children}</Pendente.Provider>
      {!semMensagem && <Mensagem estado={estado} semOk={!!avisos} />}
      {aguardando && (
        <Confirmacao
          mensagem={confirmar!}
          perigo={perigo}
          rotulo={rotuloConfirmar}
          aoCancelar={() => setAguardando(null)}
          aoConfirmar={() => {
            const dados = aguardando;
            setAguardando(null);
            enviar(dados);
          }}
        />
      )}
      {aviso && estado && <Aviso erros={estado.erros ?? []} alertas={estado.alertas ?? []} aoFechar={() => setAviso(false)} />}
    </form>
  );
}

export function Mensagem({ estado, semOk }: { estado: Estado; semOk?: boolean }) {
  if (!estado) return null;
  return (
    <div aria-live="polite">
      {estado.erros?.length ? (
        <div className="msg msg-erro">
          {estado.erros.length === 1 ? estado.erros[0] : <ul>{estado.erros.map((e) => <li key={e}>{e}</li>)}</ul>}
        </div>
      ) : null}
      {estado.ok && !semOk && <div className="msg msg-ok">{estado.ok}</div>}
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
