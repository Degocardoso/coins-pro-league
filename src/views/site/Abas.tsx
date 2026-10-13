"use client";
// VIEW — as três abas do site, marcando a atual
import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/", rotulo: "A Liga" },
  { href: "/regulamento", rotulo: "Regulamento" },
  { href: "/tabela", rotulo: "Tabela" },
  { href: "/noticias", rotulo: "Notícias" },
];

export function Abas() {
  const atual = usePathname();
  return (
    <nav className="abas" aria-label="Seções do site">
      {ABAS.map((a) => (
        <Link key={a.href} href={a.href} aria-current={(a.href === "/" ? atual === "/" : atual.startsWith(a.href)) ? "page" : undefined}>
          {a.rotulo}
        </Link>
      ))}
    </nav>
  );
}
