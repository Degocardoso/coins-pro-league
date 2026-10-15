"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/models/db";
import { PaginaController, PAGINAS, type SlugPagina } from "../PaginaController";
import { exigirArea } from "../sessao";
import { sucesso, type Estado } from "./estado";

const slugValido = (v: FormDataEntryValue | null): SlugPagina | null =>
  typeof v === "string" && v in PAGINAS ? (v as SlugPagina) : null;

export async function salvarPagina(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("regulamento");
  const slug = slugValido(form.get("slug"));
  if (!slug) return { erros: ["Página inválida."] };
  await new PaginaController(getDb()).salvar(slug, String(form.get("conteudo") ?? ""));
  revalidatePath("/admin/regulamento");
  return sucesso("Texto salvo.");
}

export async function carregarRegulamentoOficial(_: Estado, __: FormData): Promise<Estado> {
  await exigirArea("regulamento");
  await new PaginaController(getDb()).salvar("regulamento", PaginaController.textoOficial());
  revalidatePath("/admin/regulamento");
  return sucesso("Regulamento oficial carregado.");
}
