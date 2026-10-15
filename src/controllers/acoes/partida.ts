"use server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/models/db";
import { PartidaController } from "../PartidaController";
import { exigirArea } from "../sessao";
import { deInputLocal } from "@/lib/datas";
import { inteiro } from "@/lib/texto";
import { lerEstatisticas } from "./formularios";
import { falha, sucesso, type Estado } from "./estado";

const ctrl = () => new PartidaController(getDb());

export async function agendarPartida(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("resultados");
  try {
    await ctrl().agendar(inteiro(form.get("partidaId")) ?? 0, deInputLocal(form.get("dataHora")));
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/competicoes/${inteiro(form.get("competicaoId"))}/partidas`);
  return sucesso("Horário salvo.");
}

export async function definirPrazo(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("resultados");
  await ctrl().definirPrazo(inteiro(form.get("rodadaId")) ?? 0, deInputLocal(form.get("prazo")));
  revalidatePath(`/admin/competicoes/${inteiro(form.get("competicaoId"))}/partidas`);
  return sucesso("Prazo salvo.");
}

export async function lancarResultado(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("resultados");
  const partidaId = inteiro(form.get("partidaId")) ?? 0;
  const gm = inteiro(form.get("golsMandante"));
  const gv = inteiro(form.get("golsVisitante"));
  if (gm === null || gv === null) return { erros: ["Preencha o placar dos dois clubes."] };
  try {
    const r = await ctrl().lancarResultado(partidaId, {
      golsMandante: gm,
      golsVisitante: gv,
      prorrogacao: form.get("prorrogacao") === "on",
      penaltisMandante: inteiro(form.get("penaltisMandante")),
      penaltisVisitante: inteiro(form.get("penaltisVisitante")),
      estatisticas: lerEstatisticas(form),
    });
    if (!r.ok) return { erros: r.erros };
    revalidatePath(`/admin/partidas/${partidaId}`);
    revalidatePath(`/admin/competicoes/${inteiro(form.get("competicaoId"))}/partidas`);
    return sucesso("Resultado salvo.", r.alertas);
  } catch (e) {
    return falha(e);
  }
}

export async function aplicarWO(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("resultados");
  const partidaId = inteiro(form.get("partidaId")) ?? 0;
  const tipo = (["mandante_vence", "visitante_vence", "duplo"] as const).find((t) => t === form.get("tipo"));
  if (!tipo) return { erros: ["Escolha quem venceu o W.O."] };
  try {
    const r = await ctrl().aplicarWO(partidaId, tipo);
    if (!r.ok) return { erros: r.erros };
    revalidatePath(`/admin/partidas/${partidaId}`);
    revalidatePath(`/admin/competicoes/${inteiro(form.get("competicaoId"))}/partidas`);
    return sucesso("W.O. aplicado.", r.alertas);
  } catch (e) {
    return falha(e);
  }
}

export async function desfazerResultado(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("resultados");
  const partidaId = inteiro(form.get("partidaId")) ?? 0;
  try {
    const r = await ctrl().desfazerResultado(partidaId);
    if (!r.ok) return { erros: r.erros };
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/partidas/${partidaId}`);
  revalidatePath(`/admin/competicoes/${inteiro(form.get("competicaoId"))}/partidas`);
  // O aviso vai no canto (aviso flutuante): a seção do botão some, mas a tela não pula
  return sucesso("Resultado desfeito: a partida voltou a ficar sem resultado.");
}
