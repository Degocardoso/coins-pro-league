// VIEW — peças reutilizadas nas telas do admin
import type { ReactNode } from "react";

export function Cabeca({ titulo, descricao, voltar }: { titulo: string; descricao?: ReactNode; voltar?: { href: string; rotulo: string } }) {
  return (
    <header className="cabeca">
      {voltar && (
        <a className="voltar" href={voltar.href}>
          ‹ {voltar.rotulo}
        </a>
      )}
      <h1>{titulo}</h1>
      {descricao && <p>{descricao}</p>}
    </header>
  );
}

export function Secao({ titulo, dica, children, id }: { titulo: string; dica?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="secao" id={id}>
      <h2>{titulo}</h2>
      {dica && <p className="dica">{dica}</p>}
      {children}
    </section>
  );
}

export function Campo({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <label className={largo ? "campo campo-largo" : "campo"}>
      <span>{rotulo}</span>
      {children}
    </label>
  );
}

export function Escudo({ url, nome }: { url: string | null | undefined; nome: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img className="escudo" src={url} alt="" />;
  return <span className="escudo-vazio" aria-hidden>{nome.slice(0, 1).toUpperCase()}</span>;
}

export function Clube({ nome, escudoUrl, href }: { nome: string; escudoUrl: string | null | undefined; href?: string }) {
  const conteudo = (
    <>
      <Escudo url={escudoUrl} nome={nome} />
      <span>{nome}</span>
    </>
  );
  return href ? <a className="clube" href={href}>{conteudo}</a> : <span className="clube">{conteudo}</span>;
}

const CORES: Record<string, string> = {
  confirmada: "verde", finalizada: "verde", em_andamento: "verde",
  pendente: "ouro", inscricoes: "ouro", agendada: "ouro",
  espera: "cinza", rascunho: "cinza", a_agendar: "cinza", encerrada: "cinza",
  recusada: "vermelho", wo: "vermelho",
};
const NOMES: Record<string, string> = {
  confirmada: "Confirmada", pendente: "Pendente", espera: "Lista de espera", recusada: "Recusada",
  rascunho: "Rascunho", inscricoes: "Inscrições abertas", em_andamento: "Em andamento", encerrada: "Encerrada",
  a_agendar: "Sem horário", agendada: "Agendada", finalizada: "Finalizada", wo: "W.O.",
};

export function Selo({ status }: { status: string }) {
  return <span className={`selo selo-${CORES[status] ?? "cinza"}`}>{NOMES[status] ?? status}</span>;
}
