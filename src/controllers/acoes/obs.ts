"use server";
// Ações da área do OBS: abrir com a senha do OBS, trancar e ligar/desligar a liga nas cenas
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/models/db";
import { exigirArea } from "../sessao";
import { conferirSenhaObs, liberarObs, obsLiberada, senhaObsConfigurada, trancarObs } from "../obsAcesso";
import { LigaNaLiveController } from "../LigaNaLiveController";
import { falha, sucesso, type Estado } from "./estado";

const SEM_SENHA = "A senha do OBS não está configurada. Crie a variável OBS_SENHA na Vercel (mínimo de 8 caracteres) e faça um Redeploy.";

export async function abrirObs(_: Estado, form: FormData): Promise<Estado> {
  const admin = await exigirArea("obs");
  if (!senhaObsConfigurada()) return { erros: [SEM_SENHA] };
  if (!(await conferirSenhaObs(String(form.get("senha") ?? "")))) return { erros: ["Senha do OBS incorreta."] };
  await liberarObs(admin.id);
  redirect("/admin/obs");
}

export async function fecharObs(): Promise<Estado> {
  await exigirArea("obs");
  await trancarObs();
  redirect("/admin/obs");
}

export async function alternarLigaNaLive(_: Estado, form: FormData): Promise<Estado> {
  const admin = await exigirArea("obs");
  if (!(await obsLiberada(admin.id))) return { erros: ["A página do OBS trancou (10 minutos). Recarregue e abra de novo com a senha."] };
  if (!senhaObsConfigurada()) return { erros: [SEM_SENHA] };
  if (!(await conferirSenhaObs(String(form.get("senha") ?? "")))) return { erros: ["Senha do OBS incorreta. Nada foi alterado."] };
  const ligar = form.get("ligar") === "1";
  try {
    await new LigaNaLiveController(getDb()).definir(ligar, admin.id);
  } catch (e) {
    return falha(e);
  }
  revalidatePath("/admin/obs");
  return sucesso(ligar ? "Liga ligada: as cenas voltam a mostrar a liga em até 20 segundos." : "Liga desligada: tudo da liga some das cenas em até 20 segundos.");
}
