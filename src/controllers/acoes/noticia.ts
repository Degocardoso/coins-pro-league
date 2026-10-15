"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/models/db";
import { NoticiaController } from "../NoticiaController";
import { ArquivoController } from "../ArquivoController";
import { exigirArea } from "../sessao";
import { inteiro, texto } from "@/lib/texto";
import { falha, sucesso, type Estado } from "./estado";

export async function salvarNoticia(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("noticias");
  const id = inteiro(form.get("id"));
  let novaId: number | null = null;
  try {
    const imagem = await new ArquivoController(getDb()).salvarImagem(form.get("imagem"));
    if (imagem && "erro" in imagem) return { erros: [imagem.erro] };
    const dados = {
      titulo: texto(form.get("titulo")),
      texto: texto(form.get("texto")),
      publicada: form.get("publicada") === "on",
      ...(imagem ? { imagemUrl: imagem.url } : form.get("removerImagem") === "on" ? { imagemUrl: null } : {}),
    };
    const ctrl = new NoticiaController(getDb());
    if (id) await ctrl.atualizar(id, dados);
    else novaId = (await ctrl.criar(dados)).id;
  } catch (e) {
    return falha(e);
  }
  revalidatePath("/admin/noticias");
  if (novaId) redirect(`/admin/noticias/${novaId}`);
  revalidatePath(`/admin/noticias/${id}`);
  return sucesso("Notícia salva.");
}

export async function excluirNoticia(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("noticias");
  await new NoticiaController(getDb()).excluir(inteiro(form.get("id")) ?? 0);
  revalidatePath("/admin/noticias");
  redirect("/admin/noticias");
}
