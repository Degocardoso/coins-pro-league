"use server";
import { redirect } from "next/navigation";
import { getDb } from "@/models/db";
import { AuthController } from "../AuthController";
import { encerrarSessao, iniciarSessao } from "../sessao";
import { texto } from "@/lib/texto";
import type { Estado } from "./estado";

export async function entrar(_: Estado, form: FormData): Promise<Estado> {
  const admin = await new AuthController(getDb()).login(texto(form.get("email")), texto(form.get("senha")));
  if (!admin) return { erros: ["E-mail ou senha incorretos."] };
  await iniciarSessao(admin);
  redirect("/admin");
}

export async function sair() {
  await encerrarSessao();
  redirect("/admin/login");
}
