"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/models/db";
import { ClubeController } from "../ClubeController";
import { ArquivoController } from "../ArquivoController";
import { TemporadaController } from "../TemporadaController";
import { exigirAdmin } from "../sessao";
import { inteiro, texto } from "@/lib/texto";
import { falha, sucesso, type Estado } from "./estado";

const PLATAFORMAS = ["ps5", "xbox", "pc"] as const;
const ctrl = () => new ClubeController(getDb());

async function temporadaAtivaId() {
  const t = await new TemporadaController(getDb()).ativa();
  if (!t) throw new Error("Crie e ative uma temporada primeiro");
  return t.id;
}

export async function criarClube(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  let novoId: number;
  try {
    const escudo = await new ArquivoController(getDb()).salvarImagem(form.get("escudo"));
    if (escudo && "erro" in escudo) return { erros: [escudo.erro] };
    novoId = (await ctrl().criar(texto(form.get("nome")), escudo?.url ?? null)).id;
  } catch (e) {
    return falha(e);
  }
  redirect(`/admin/clubes/${novoId}`);
}

export async function salvarClube(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  const id = inteiro(form.get("id")) ?? 0;
  try {
    const escudo = await new ArquivoController(getDb()).salvarImagem(form.get("escudo"));
    if (escudo && "erro" in escudo) return { erros: [escudo.erro] };
    const escudoUrl = escudo ? escudo.url : form.get("removerEscudo") === "on" ? null : undefined;
    await ctrl().atualizar(id, texto(form.get("nome")), escudoUrl);
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/clubes/${id}`);
  return sucesso("Clube salvo.");
}

export async function adicionarAtleta(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  const clubeId = inteiro(form.get("clubeId")) ?? 0;
  try {
    const r = await ctrl().adicionarAtleta(await temporadaAtivaId(), clubeId, {
      nomePersonagem: texto(form.get("nomePersonagem")),
      plataforma: PLATAFORMAS.find((p) => p === form.get("plataforma")) ?? "ps5",
      idPlataforma: texto(form.get("idPlataforma")),
      twitch: texto(form.get("twitch")) || null,
    });
    if (!r.ok) return { erros: r.erros };
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/clubes/${clubeId}`);
  return sucesso("Atleta adicionado ao elenco.");
}

export async function removerAtleta(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  const clubeId = inteiro(form.get("clubeId")) ?? 0;
  try {
    const r = await ctrl().removerAtleta(await temporadaAtivaId(), clubeId, inteiro(form.get("atletaId")) ?? 0);
    if (!r.ok) return { erros: r.erros };
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/clubes/${clubeId}`);
  return sucesso("Atleta liberado.");
}

export async function alternarCapitao(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  const clubeId = inteiro(form.get("clubeId")) ?? 0;
  try {
    await ctrl().definirCapitao(inteiro(form.get("vinculoId")) ?? 0, form.get("capitao") === "1");
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/clubes/${clubeId}`);
  return sucesso("Capitães atualizados.");
}

export async function excluirClube(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  try {
    await ctrl().excluir(inteiro(form.get("id")) ?? 0);
  } catch (e) {
    return falha(e);
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/clubes");
}

export async function editarAtleta(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  try {
    await ctrl().editarAtleta(inteiro(form.get("atletaId")) ?? 0, {
      nomePersonagem: texto(form.get("nomePersonagem")),
      plataforma: PLATAFORMAS.find((p) => p === form.get("plataforma")) ?? "ps5",
      idPlataforma: texto(form.get("idPlataforma")),
      twitch: texto(form.get("twitch")) || null,
    });
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/clubes/${inteiro(form.get("clubeId"))}`);
  return sucesso("Atleta salvo.");
}

export async function excluirAtleta(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  try {
    await ctrl().excluirAtleta(inteiro(form.get("atletaId")) ?? 0);
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/clubes/${inteiro(form.get("clubeId"))}`);
  return sucesso("Atleta excluído.");
}
