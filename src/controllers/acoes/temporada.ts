"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/models/db";
import { TemporadaController } from "../TemporadaController";
import { exigirAdmin } from "../sessao";
import { deInputLocal } from "@/lib/datas";
import { inteiro, texto } from "@/lib/texto";
import { falha, sucesso, type Estado } from "./estado";

export async function criarTemporada(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  try {
    await new TemporadaController(getDb()).criar(inteiro(form.get("numero")) ?? 0, texto(form.get("nome")));
  } catch (e) {
    return falha(e);
  }
  revalidatePath("/admin", "layout");
  return sucesso("Temporada criada.");
}

export async function salvarJanela(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  try {
    await new TemporadaController(getDb()).definirJanela(
      inteiro(form.get("id")) ?? 0,
      deInputLocal(form.get("inicio")),
      deInputLocal(form.get("fim")),
    );
  } catch (e) {
    return falha(e);
  }
  revalidatePath("/admin/temporada");
  return sucesso("Janela salva.");
}

export async function ativarTemporada(_: Estado, form: FormData): Promise<Estado> {
  await exigirAdmin();
  await new TemporadaController(getDb()).ativar(inteiro(form.get("id")) ?? 0);
  revalidatePath("/admin", "layout");
  return sucesso("Temporada ativada.");
}
