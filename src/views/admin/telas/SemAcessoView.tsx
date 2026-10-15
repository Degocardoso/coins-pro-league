// VIEW — página para quem tentou abrir uma área sem acesso
import { nomeDaArea } from "@/lib/acesso";
import { Cabeca } from "../componentes";

export function SemAcessoView({ area }: { area: string | null }) {
  const nome = area === "equipe" ? "Equipe" : area ? nomeDaArea(area) : "essa área";
  return (
    <>
      <Cabeca titulo="Sem acesso" />
      <div className="sem-acesso">
        <p>
          Você não tem acesso a <strong>{nome}</strong>.{" "}
          {area === "equipe" ? "Só o dono mexe na Equipe." : "Se precisar, peça para o dono liberar na Equipe."}
        </p>
        <p><a className="btn" href="/admin">Voltar ao Painel</a></p>
      </div>
    </>
  );
}
