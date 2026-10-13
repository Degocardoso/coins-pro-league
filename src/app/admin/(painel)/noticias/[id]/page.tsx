import { notFound } from "next/navigation";
import { exigirAdmin } from "@/controllers/sessao";
import { NoticiaController } from "@/controllers/NoticiaController";
import { getDb } from "@/models/db";
import { NoticiaView } from "@/views/admin/telas/NoticiasView";

// /admin/noticias/nova abre o formulário vazio
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  await exigirAdmin();
  const { id } = await params;
  if (id === "nova") return <NoticiaView noticia={null} />;
  const noticia = Number.isInteger(Number(id)) ? await new NoticiaController(getDb()).buscar(Number(id)) : null;
  if (!noticia) notFound();
  return <NoticiaView noticia={noticia} />;
}
