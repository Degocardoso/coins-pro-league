// VIEW — moldura do painel: menu lateral e área de conteúdo
import type { ReactNode } from "react";
import { sair } from "@/controllers/acoes/auth";
import { Menu } from "../Menu";
import { SeletorTema } from "@/views/comum/SeletorTema";

type Pessoa = { nome: string; dono: boolean; areas: string[] };

export function Moldura({ pessoa, temporada, pendentes, children }: { pessoa: Pessoa; temporada: string | null; pendentes: number; children: ReactNode }) {
  return (
    <div className="adm">
      <aside className="adm-menu">
        <a className="marca" href="/admin">
          <span className="wordmark">the<b className="c">coin</b><b className="s">squash</b></span>
          <span className="sub">Pro League</span>
          <span className="temporada">{temporada ?? "Nenhuma temporada ativa"}</span>
        </a>
        <Menu pendentes={pendentes} dono={pessoa.dono} areas={pessoa.areas} />
        <div className="adm-conta">
          <a className="minha-conta" href="/admin/conta">
            <span>{pessoa.nome}</span>
            <small>{pessoa.dono ? "Dono" : "Minha conta"}</small>
          </a>
          <form action={sair}>
            <button type="submit" className="btn btn-mini">Sair</button>
          </form>
          <SeletorTema />
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
