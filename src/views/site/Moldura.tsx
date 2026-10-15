// VIEW — topo com as abas e rodapé do site
import type { ReactNode } from "react";
import { Abas } from "./Abas";
import { SeletorTema } from "@/views/comum/SeletorTema";

export function MolduraSite({ children }: { children: ReactNode }) {
  return (
    <div className="site">
      <header className="topo">
        <div className="miolo">
          <a className="marca-site" href="/" aria-label="thecoinsquash Pro League, página inicial">
            <span className="wordmark">the<b className="c">coin</b><b className="s">squash</b></span>
            <span className="sub">Pro League</span>
          </a>
          <Abas />
          <SeletorTema />
        </div>
      </header>
      <main>
        <div className="miolo">{children}</div>
      </main>
      <footer className="rodape">
        <div className="miolo">
          <span>Liga de Pro Clubs organizada pelo canal thecoinsquash.</span>
          <nav aria-label="Redes do canal">
            <a href="https://twitch.tv/thecoinsquash" target="_blank" rel="noopener noreferrer">Twitch</a>
            <a href="https://kick.com/thecoinsquash" target="_blank" rel="noopener noreferrer">Kick</a>
            <a href="https://x.com/thecoinsquash" target="_blank" rel="noopener noreferrer">X</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
