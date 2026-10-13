// CONTROLLER — dados da aba Tabela: classificação e rankings com nomes
import type { Db } from "@/models/db";
import { competicoesRepo, estatisticasRepo, nomesRepo, partidasRepo } from "@/models/repositories";
import { calcularClassificacao } from "./regras/classificacao";
import { calcularRankings, type ItemRanking } from "./regras/rankings";

export class ClassificacaoController {
  constructor(private db: Db) {}

  async classificacao(competicaoId: number) {
    const clubeIds = await competicoesRepo.clubesConfirmados(this.db, competicaoId);
    const todas = await partidasRepo.daCompeticao(this.db, competicaoId);
    const encerradas = todas
      .map((t) => t.partida)
      .filter((p) => (p.status === "finalizada" || p.status === "wo") && p.mandanteId && p.visitanteId)
      .map((p) => ({
        mandanteId: p.mandanteId!,
        visitanteId: p.visitanteId!,
        golsMandante: p.golsMandante,
        golsVisitante: p.golsVisitante,
        wo: p.wo,
      }));
    const linhas = calcularClassificacao(clubeIds, encerradas);
    const nomes = await nomesRepo.clubes(this.db, clubeIds);
    return linhas.map((l) => ({ ...l, clube: nomes.get(l.clubeId)! }));
  }

  async rankings(competicaoId: number, limite = 10) {
    const linhas = await estatisticasRepo.paraRanking(this.db, competicaoId);
    const r = calcularRankings(
      linhas.map(({ e, p }) => ({
        ...e,
        golsSofridosPeloClube: (e.clubeId === p.mandanteId ? p.golsVisitante : p.golsMandante) ?? 0,
      })),
      limite,
    );
    const todos = Object.values(r).flat();
    const [atletas, clubes] = await Promise.all([
      nomesRepo.atletas(this.db, todos.map((i) => i.atletaId)),
      nomesRepo.clubes(this.db, todos.map((i) => i.clubeId)),
    ]);
    const comNomes = (lista: ItemRanking[]) =>
      lista.map((i) => ({ ...i, atleta: atletas.get(i.atletaId)!, clube: clubes.get(i.clubeId)! }));
    return {
      artilharia: comNomes(r.artilharia),
      assistencias: comNomes(r.assistencias),
      mvp: comNomes(r.mvp),
      penaltis: comNomes(r.penaltis),
      semSofrerGol: comNomes(r.semSofrerGol),
    };
  }
}
