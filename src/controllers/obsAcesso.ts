// CONTROLLER — senha da área do OBS (variável OBS_SENHA na Vercel), separada do login.
// Abrir a página libera por 10 minutos; ligar/desligar a liga pede a senha de novo, sempre.
import "server-only";
import { cookies } from "next/headers";
import { criarToken, lerToken, senhaIgual } from "@/lib/seguranca";
import { segredo } from "./sessao";

const COOKIE = "cpl_obs";
export const LIBERADO_MS = 10 * 60 * 1000;
export const SENHA_OBS_MINIMA = 8;

// Chave própria: o token do OBS não pode ser trocado pelo cookie de login (mesmo formato)
const segredoObs = () => `${segredo()}:area-do-obs`;

export function senhaObsConfigurada() {
  const s = process.env.OBS_SENHA;
  return !!s && s.length >= SENHA_OBS_MINIMA;
}

/** Confere a senha do OBS. Errou: espera um pouco antes de responder, para atrapalhar tentativa em massa. */
export async function conferirSenhaObs(digitada: string) {
  const configurada = process.env.OBS_SENHA;
  if (!configurada || configurada.length < SENHA_OBS_MINIMA) return false;
  const ok = senhaIgual(digitada, configurada);
  if (!ok) await new Promise((r) => setTimeout(r, 800));
  return ok;
}

export async function liberarObs(adminId: number) {
  const expiraEm = Date.now() + LIBERADO_MS;
  (await cookies()).set(COOKIE, criarToken({ adminId, expiraEm }, segredoObs()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    expires: new Date(expiraEm),
  });
}

export async function obsLiberada(adminId: number) {
  const dados = lerToken((await cookies()).get(COOKIE)?.value, segredoObs(), Date.now(), LIBERADO_MS);
  return dados?.adminId === adminId;
}

export async function trancarObs() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}
