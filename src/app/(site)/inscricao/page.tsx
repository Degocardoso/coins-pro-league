import type { Metadata } from "next";
import { getDb } from "@/models/db";
import { InscricaoController } from "@/controllers/InscricaoController";
import { competicoesRepo } from "@/models/repositories";
import { InscricaoView } from "@/views/site/InscricaoView";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ c?: string }> };

// Link de uma competição (/i/2 leva para cá): a prévia no WhatsApp e no X mostra a arte DELA, com taxa e prêmio
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const c = Number((await searchParams).c);
  const comp = Number.isInteger(c) && c > 0 ? await competicoesRepo.buscar(getDb(), c) : null;
  if (!comp || !comp.ativa) return { title: "Inscrever clube" };
  const titulo = `Inscrições: ${comp.nome}`;
  const imagem = { url: `/divulgacao/${comp.id}/og`, width: 1200, height: 630, alt: `${comp.nome}: arte de divulgação` };
  return {
    title: titulo,
    openGraph: { title: titulo, description: "Inscreva seu clube na liga de Pro Clubs do EA SPORTS FC 27 da comunidade thecoinsquash.", images: [imagem] },
    twitter: { card: "summary_large_image", title: titulo, images: [imagem.url] },
  };
}

export default async function Pagina({ searchParams }: Props) {
  const c = Number((await searchParams).c) || undefined;
  return <InscricaoView abertas={await new InscricaoController(getDb()).abertas()} competicaoId={c} />;
}
