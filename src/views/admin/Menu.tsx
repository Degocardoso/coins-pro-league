"use client";
// VIEW — links do menu lateral, marcando a página atual
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/admin", rotulo: "Painel" },
  { href: "/admin/competicoes", rotulo: "Competições" },
  { href: "/admin/clubes", rotulo: "Clubes" },
  { href: "/admin/noticias", rotulo: "Notícias" },
  { href: "/admin/regulamento", rotulo: "Regulamento" },
  { href: "/admin/obs", rotulo: "OBS" },
  { href: "/admin/temporada", rotulo: "Temporada" },
];

export function Menu({ pendentes = 0 }: { pendentes?: number }) {
  const atual = usePathname();
  const ativo = (href: string) => (href === "/admin" ? atual === "/admin" : atual.startsWith(href));
  return (
    <nav aria-label="Menu do painel">
      {ITENS.map((i) => (
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
