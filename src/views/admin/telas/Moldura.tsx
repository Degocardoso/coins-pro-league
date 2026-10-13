// VIEW — moldura do painel: menu lateral e área de conteúdo
import type { ReactNode } from "react";
import { sair } from "@/controllers/acoes/auth";
import { Menu } from "../Menu";
import { SeletorTema } from "@/views/comum/SeletorTema";

export function Moldura({ nome, temporada, children }: { nome: string; temporada: string | null; children: ReactNode }) {
  return (
    <div className="adm">
      <aside className="adm-menu">
        <a className="marca" href="/admin">
          <b>Coin&apos;s</b> Pro League
          <span>{temporada ?? "Nenhuma temporada ativa"}</span>
        </a>
        <Menu />
        <div className="adm-conta">
          <span>{nome}</span>
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
