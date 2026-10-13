import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDb } from "@/models/db";
import { JornalController } from "@/controllers/JornalController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { MateriaView } from "@/views/site/JornalView";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

// Título, resumo e imagem que aparecem quando o link é compartilhado no X ou no Discord
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dados = await new JornalController(getDb()).noticia(Number((await params).id));
  if (!dados) return { title: "Notícia não encontrada" };
  const { titulo, texto, imagemUrl } = dados.noticia;
  const resumo = texto.replace(/\s+/g, " ").slice(0, 160);
  return {
    title: titulo,
    description: resumo,
    openGraph: { title: titulo, description: resumo, type: "article", images: imagemUrl ? [imagemUrl] : undefined },
    twitter: { card: imagemUrl ? "summary_large_image" : "summary", title: titulo, description: resumo },
  };
}

export default async function Pagina({ params }: Props) {
  const db = getDb();
  const dados = await new JornalController(db).noticia(Number((await params).id));
  if (!dados) notFound();
  const temporada = await new TemporadaController(db).ativa();
  return <MateriaView dados={dados} temporada={temporada?.nome ?? null} />;
}
