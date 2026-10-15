"use server";
// Ações da Equipe (só o dono): criar pessoa, mudar acesso, gerar senha nova e remover
import { revalidatePath } from "next/cache";
import { getDb } from "@/models/db";
import { EquipeController } from "../EquipeController";
import { exigirDono } from "../sessao";
import { inteiro, texto } from "@/lib/texto";
import { falha, sucesso, type Estado } from "./estado";

const ctrl = () => new EquipeController(getDb());

export async function criarPessoa(_: Estado, form: FormData): Promise<Estado> {
  await exigirDono();
  try {
    const { admin, senha } = await ctrl().criar({ nome: texto(form.get("nome")), email: texto(form.get("email")), areas: form.getAll("areas") });
    revalidatePath("/admin/equipe");
    return { ...sucesso(`${admin.nome} entrou na equipe.`), segredo: { titulo: `Senha de ${admin.nome}`, valor: senha } };
  } catch (e) {
    return falha(e);
  }
}

export async function salvarAcesso(_: Estado, form: FormData): Promise<Estado> {
  await exigirDono();
  try {
    const nome = await ctrl().atualizarAcesso(inteiro(form.get("id")) ?? 0, { nome: texto(form.get("nome")), areas: form.getAll("areas") });
    revalidatePath("/admin/equipe");
    return sucesso(`Acesso de ${nome} salvo.`);
  } catch (e) {
    return falha(e);
  }
}

export async function novaSenha(_: Estado, form: FormData): Promise<Estado> {
  await exigirDono();
  try {
    const { nome, senha } = await ctrl().gerarNovaSenha(inteiro(form.get("id")) ?? 0);
    revalidatePath("/admin/equipe");
    return { ...sucesso(`Senha nova gerada. As sessões abertas de ${nome} foram encerradas.`), segredo: { titulo: `Senha nova de ${nome}`, valor: senha } };
  } catch (e) {
    return falha(e);
  }
}

export async function removerPessoa(_: Estado, form: FormData): Promise<Estado> {
  await exigirDono();
  try {
    const nome = await ctrl().remover(inteiro(form.get("id")) ?? 0);
    revalidatePath("/admin/equipe");
    return sucesso(`${nome} saiu da equipe. Se estava logado, já perdeu o acesso.`);
  } catch (e) {
    return falha(e);
  }
}
