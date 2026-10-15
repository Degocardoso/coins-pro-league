"use server";
// Minha conta: qualquer pessoa da equipe troca a própria senha
import { getDb } from "@/models/db";
import { AuthController } from "../AuthController";
import { exigirAdmin, iniciarSessao } from "../sessao";
import { falha, sucesso, type Estado } from "./estado";

export async function trocarMinhaSenha(_: Estado, form: FormData): Promise<Estado> {
  const eu = await exigirAdmin();
  try {
    const atualizado = await new AuthController(getDb()).trocarMinhaSenha(
      eu.id,
      String(form.get("atual") ?? ""),
      String(form.get("nova") ?? ""),
      String(form.get("confirmacao") ?? ""),
    );
    // Renova a sessão deste aparelho com a versão nova; os outros aparelhos caem
    await iniciarSessao(atualizado);
    return sucesso("Senha trocada. Se você estava logado em outro aparelho, ele foi desconectado.");
  } catch (e) {
    return falha(e);
  }
}
