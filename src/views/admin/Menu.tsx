"use client";
// VIEW — links do menu lateral: só as áreas que a pessoa pode usar, marcando a página atual
import Link from "next/link";
import { usePathname } from "next/navigation";
import { podeAcessar, type Area } from "@/lib/acesso";

const ITENS: { href: string; rotulo: string; area?: Area; soDono?: boolean }[] = [
  { href: "/admin", rotulo: "Painel" },
  { href: "/admin/competicoes", rotulo: "Competições", area: "competicoes" },
  { href: "/admin/resultados", rotulo: "Resultados", area: "resultados" },
  { href: "/admin/clubes", rotulo: "Clubes", area: "clubes" },
  { href: "/admin/noticias", rotulo: "Notícias", area: "noticias" },
  { href: "/admin/regulamento", rotulo: "Regulamento", area: "regulamento" },
  { href: "/admin/obs", rotulo: "OBS", area: "obs" },
  { href: "/admin/temporada", rotulo: "Temporada", area: "temporada" },
  { href: "/admin/equipe", rotulo: "Equipe", soDono: true },
];

export function Menu({ pendentes = 0, dono, areas }: { pendentes?: number; dono: boolean; areas: string[] }) {
  const atual = usePathname();
  // Rodadas e resultados ficam dentro de /admin/competicoes/.../partidas, mas são da área Resultados
  const deResultados = atual.includes("/partidas") || atual.startsWith("/admin/resultados");
  const ativo = (href: string) => {
    if (href === "/admin") return atual === "/admin";
    if (href === "/admin/resultados") return deResultados;
    if (href === "/admin/competicoes") return atual.startsWith(href) && !deResultados;
    return atual.startsWith(href);
  };
  const visiveis = ITENS.filter((i) => (i.soDono ? dono : !i.area || podeAcessar({ dono, areas }, i.area)));
  return (
    <nav aria-label="Menu do painel">
      {visiveis.map((i) => (
        <Link key={i.href} href={i.href} aria-current={ativo(i.href) ? "page" : undefined}>
          {i.rotulo}
          {i.href === "/admin/competicoes" && pendentes > 0 && (
            <span className="contador" title={`${pendentes} inscrição(ões) esperando análise`}>{pendentes}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
