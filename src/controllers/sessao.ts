// CONTROLLER — sessão do painel: cookie assinado, checado em toda página e ação do admin
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/models/db";
import { adminsRepo } from "@/models/repositories/cadastros";
import { criarToken, lerToken } from "@/lib/seguranca";
import { podeAcessar, type Area } from "@/lib/acesso";

const COOKIE = "cpl_sessao";
export const DURACAO_MS = 8 * 60 * 60 * 1000; // 8 horas desde o login, mesmo usando

export function segredo() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET ausente ou curta (mínimo 32 caracteres)");
  return s;
}

/** A versão da sessão vai no cookie: trocar a senha (ou o dono gerar uma nova) derruba as sessões abertas. */
export async function iniciarSessao(admin: { id: number; versaoSessao: number }) {
  const expiraEm = Date.now() + DURACAO_MS;
  (await cookies()).set(COOKIE, criarToken({ adminId: admin.id, expiraEm, v: admin.versaoSessao }, segredo()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiraEm),
  });
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE);
}

/** Admin logado ou redireciona para o login. Use no começo de toda página e ação do painel. */
export async function exigirAdmin() {
  // Recusa também sessões com prazo maior que 8 h (criadas pela regra antiga de 7 dias)
  const dados = lerToken((await cookies()).get(COOKIE)?.value, segredo(), Date.now(), DURACAO_MS);
  const admin = dados ? await adminsRepo.porId(getDb(), dados.adminId) : null;
  // Pessoa removida da equipe ou senha trocada depois deste login: a sessão não vale mais
  if (!admin || (dados?.v ?? 0) !== admin.versaoSessao) redirect("/admin/login");
  return admin;
}

/** Admin com acesso à área, ou a página de "sem acesso". Use em toda página e ação da área. */
export async function exigirArea(area: Area) {
  const admin = await exigirAdmin();
  if (!podeAcessar(admin, area)) redirect(`/admin/sem-acesso?area=${area}`);
  return admin;
}

/** Só o dono (a Equipe). */
export async function exigirDono() {
  const admin = await exigirAdmin();
  if (!admin.dono) redirect("/admin/sem-acesso?area=equipe");
  return admin;
}
