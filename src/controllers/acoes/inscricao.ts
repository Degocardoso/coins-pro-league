"use server";
// Ação pública (sem login): inscrição de clube pelo site
import { revalidatePath } from "next/cache";
import { getDb } from "@/models/db";
import { InscricaoController } from "../InscricaoController";
import { validarImagem } from "@/lib/imagem";
import { inteiro, texto } from "@/lib/texto";
import { lerAtletasInscricao } from "./formularios";
import { sucesso, type Estado } from "./estado";

export async function inscreverClube(_: Estado, form: FormData): Promise<Estado> {
  // Campo invisível para pessoas: robôs costumam preencher
  if (texto(form.get("site"))) return sucesso("Inscrição recebida.");
  if (form.get("aceite") !== "on") return { erros: ["Confirme que leu e aceita o regulamento."] };

  let escudo: { nome: string; mime: string; bytes: Buffer } | null = null;
  const arquivo = form.get("escudo");
  if (arquivo instanceof File && arquivo.size > 0) {
    const bytes = Buffer.from(await arquivo.arrayBuffer());
    const v = validarImagem(bytes);
    if ("erro" in v) return { erros: [`Escudo: ${v.erro}`] };
    escudo = { nome: arquivo.name.slice(0, 200), mime: v.tipo, bytes };
  }

  try {
    const r = await new InscricaoController(getDb()).inscrever({
      competicaoId: inteiro(form.get("competicaoId")) ?? 0,
      nomeClube: texto(form.get("nomeClube")),
      escudo,
      capitaoSub: form.get("capitaoSub") === "on",
      twitchCapitao: texto(form.get("twitch")).replace(/^@/, "") || null,
      atletas: lerAtletasInscricao(form),
    });
    if (!r.ok) return { erros: r.erros };
    revalidatePath("/admin");
    return sucesso(
      `Inscrição do ${r.clube} recebida. A organização confere os dados e confirma a vaga no Discord.`,
    );
  } catch (e) {
    // Erro inesperado: não mostra detalhe interno para o público
    console.error("Falha na inscrição pública", e);
    return { erros: ["Não deu para concluir a inscrição agora. Tente de novo em alguns minutos."] };
  }
}
