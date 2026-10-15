// CONTROLLER — divulgação de uma competição: conteúdo das artes e textos dos posts, a partir da ficha
import type { Db } from "@/models/db";
import { competicoesRepo } from "@/models/repositories";
import { temporadasRepo } from "@/models/repositories/cadastros";
import { montarConteudo, montarTextos } from "./regras/divulgacao";

export class DivulgacaoController {
  constructor(private db: Db) {}

  async dados(competicaoId: number, origem: string, agora = new Date()) {
    const c = await competicoesRepo.buscar(this.db, competicaoId);
    if (!c || !c.ativa) return null;
    const temporada = await temporadasRepo.buscar(this.db, c.temporadaId);
    const conteudo = montarConteudo({ ...c, temporada: temporada?.nome ?? "Temporada" }, origem, agora);
    return { competicao: c, conteudo, textos: montarTextos(conteudo) };
  }
}
