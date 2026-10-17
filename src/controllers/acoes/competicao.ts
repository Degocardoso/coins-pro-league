"use server";
import { DiscordController } from "../DiscordController";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/models/db";
import { CompeticaoController, type FichaCompeticao } from "../CompeticaoController";
import { ArquivoController } from "../ArquivoController";
import { TemporadaController } from "../TemporadaController";
import { exigirArea } from "../sessao";
import { deInputLocal } from "@/lib/datas";
import { centavos, inteiro, texto } from "@/lib/texto";
import { falha, sucesso, type Estado } from "./estado";

const STATUS = ["rascunho", "inscricoes", "em_andamento", "encerrada"] as const;
const id = (form: FormData, campo = "id") => inteiro(form.get(campo)) ?? 0;
const ctrl = () => new CompeticaoController(getDb());

export async function criarCompeticao(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  let novaId: number;
  try {
    const temporada = await new TemporadaController(getDb()).ativa();
    if (!temporada) throw new Error("Crie e ative uma temporada primeiro");
    const tipo = form.get("tipo") === "copa" ? "copa" : "liga";
    novaId = (await ctrl().criar(temporada.id, tipo, texto(form.get("nome")))).id;
  } catch (e) {
    return falha(e);
  }
  redirect(`/admin/competicoes/${novaId}`);
}

export async function salvarFicha(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  try {
    const banner = await new ArquivoController(getDb()).salvarImagem(form.get("banner"));
    if (banner && "erro" in banner) return { erros: [banner.erro] };
    const status = STATUS.find((s) => s === form.get("status")) ?? "rascunho";
    const ficha: FichaCompeticao = {
      nome: texto(form.get("nome")),
      status,
      ativa: form.get("ativa") === "on",
      maxClubes: inteiro(form.get("maxClubes")) ?? 0,
      dataInicio: deInputLocal(form.get("dataInicio")),
      dataFim: deInputLocal(form.get("dataFim")),
      inscricaoSubInicio: deInputLocal(form.get("inscricaoSubInicio")),
      inscricaoInicio: deInputLocal(form.get("inscricaoInicio")),
      inscricaoFim: deInputLocal(form.get("inscricaoFim")),
      taxaCentavos: centavos(form.get("taxa")),
      premio: texto(form.get("premio")) || null,
      ...(banner ? { bannerUrl: banner.url } : form.get("removerBanner") === "on" ? { bannerUrl: null } : {}),
    };
    await ctrl().atualizarFicha(id(form), ficha);
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/competicoes/${id(form)}`);
  return sucesso("Ficha salva.");
}

export async function inscreverClube(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  try {
    await ctrl().inscreverClube(id(form), id(form, "clubeId"));
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/competicoes/${id(form)}`);
  return sucesso("Clube inscrito como pendente.");
}

export async function acaoInscricao(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  const competicaoId = id(form);
  const inscricaoId = id(form, "inscricaoId");
  let msg = "Inscrição atualizada.";
  try {
    switch (form.get("acao")) {
      case "confirmar": {
        const status = await ctrl().confirmarInscricao(inscricaoId);
        msg = status === "confirmada" ? "Inscrição confirmada." : "Sem vagas: foi para a lista de espera.";
        break;
      }
      case "recusar":
        await ctrl().recusarInscricao(inscricaoId, texto(form.get("motivo")));
        break;
      case "pendente":
        await ctrl().voltarParaPendente(inscricaoId);
        break;
      case "pago":
        await ctrl().alterarInscricao(inscricaoId, { pago: form.get("valor") === "1" });
        break;
      case "sub":
        await ctrl().alterarInscricao(inscricaoId, { capitaoSub: form.get("valor") === "1" });
        break;
      case "remover":
        await ctrl().removerInscricao(competicaoId, inscricaoId);
        msg = "Inscrição removida.";
        break;
    }
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/competicoes/${competicaoId}`);
  return sucesso(msg);
}

export async function gerarTabela(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  const competicaoId = id(form);
  try {
    await ctrl().gerar(competicaoId, form.get("sortear") === "on");
  } catch (e) {
    return falha(e);
  }
  redirect(`/admin/competicoes/${competicaoId}/partidas`);
}

export async function apagarTabela(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  const competicaoId = id(form);
  try {
    await ctrl().apagarTabela(competicaoId);
  } catch (e) {
    return falha(e);
  }
  revalidatePath(`/admin/competicoes/${competicaoId}`);
  revalidatePath("/admin");
  return sucesso("Tabela apagada. Ajuste as inscrições e gere de novo quando quiser.");
}

export async function excluirCompeticao(_: Estado, form: FormData): Promise<Estado> {
  await exigirArea("competicoes");
  try {
    await ctrl().excluir(id(form));
  } catch (e) {
    return falha(e);
  }
  revalidatePath("/admin", "layout");
  redirect("/admin/competicoes");
}

export async function salvarDiscord(_: Estado, form: FormData): Promise<Estado> {
  const admin = await exigirArea("competicoes");
  try {
    const link = await new DiscordController(getDb()).definir(texto(form.get("convite")), admin.id);
    revalidatePath("/admin", "layout");
    return sucesso(link ? "Link do Discord salvo." : "Link do Discord removido.");
  } catch (e) {
    return falha(e);
  }
}
