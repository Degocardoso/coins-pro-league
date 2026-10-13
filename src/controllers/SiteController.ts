// CONTROLLER — dados das três abas do site público
import type { Db } from "@/models/db";
import { competicoesRepo, nomesRepo, partidasRepo, type Partida } from "@/models/repositories";
import { competicoesAdminRepo, temporadasRepo } from "@/models/repositories/cadastros";
import { siteRepo } from "@/models/repositories/site";
import { ClassificacaoController } from "./ClassificacaoController";
import { PartidaController } from "./PartidaController";
import { PaginaController } from "./PaginaController";
import { vencedorDaPartida } from "./regras/copa";
import { situacaoInscricao } from "./regras/elenco";

type ClubeInfo = { nome: string; escudoUrl: string | null };

export type JogoSite = Partida & { mandante: ClubeInfo | null; visitante: ClubeInfo | null };

export class SiteController {
  constructor(private db: Db) {}

  /** Competições visíveis no site: da temporada ativa, ativas e fora de rascunho. Liga primeiro. */
  async competicoes() {
    const temporada = await temporadasRepo.ativa(this.db);
    if (!temporada) return { temporada: null, lista: [] };
    const lista = (await competicoesAdminRepo.listar(this.db, temporada.id))
      .filter((c) => c.ativa && c.status !== "rascunho")
      .sort((a, b) => (a.tipo === b.tipo ? a.id - b.id : a.tipo === "liga" ? -1 : 1));
    return { temporada, lista };
  }

  private async comNomes(ps: Partida[]): Promise<JogoSite[]> {
    const ids = ps.flatMap((p) => [p.mandanteId, p.visitanteId]).filter((x): x is number => x !== null);
    const nomes = await nomesRepo.clubes(this.db, ids);
    return ps.map((p) => ({
      ...p,
      mandante: p.mandanteId ? nomes.get(p.mandanteId) ?? null : null,
      visitante: p.visitanteId ? nomes.get(p.visitanteId) ?? null : null,
    }));
  }

  /** Campeão de uma competição encerrada: líder da liga ou vencedor da final da copa. */
  private async campeao(c: { id: number; tipo: "liga" | "copa"; status: string }) {
    if (c.status !== "encerrada") return null;
    if (c.tipo === "liga") {
      const [lider] = await new ClassificacaoController(this.db).classificacao(c.id);
      return lider && lider.jogos > 0 ? lider.clube : null;
    }
    const todas = await partidasRepo.daCompeticao(this.db, c.id);
    const final = todas.at(-1)?.partida;
    const id = final?.mandanteId && final.visitanteId
      ? vencedorDaPartida({ ...final, mandanteId: final.mandanteId, visitanteId: final.visitanteId })
      : null;
    return id ? (await nomesRepo.clubes(this.db, [id])).get(id) ?? null : null;
  }

  /** Aba "A Liga": apresentação, destaque, ficha e clubes com elenco. */
  async aLiga(agora = new Date()) {
    const { temporada, lista } = await this.competicoes();
    const principal = lista[0] ?? null;
    if (!temporada || !principal) return { temporada, principal: null, competicoes: lista, clubes: [], destaque: null, inscricoes: [], campeoes: [] };

    const ids = lista.map((c) => c.id);
    const [clubeIds, proximo, ultimo] = await Promise.all([
      competicoesRepo.clubesConfirmados(this.db, principal.id),
      siteRepo.proximoJogo(this.db, ids, agora),
      siteRepo.ultimoResultado(this.db, ids),
    ]);
    const [clubes, elencos] = await Promise.all([
      siteRepo.clubesPorIds(this.db, clubeIds),
      siteRepo.elencos(this.db, temporada.id, clubeIds),
    ]);
    const escolhido = proximo ?? ultimo;
    const [destaque] = escolhido ? await this.comNomes([escolhido]) : [];
    const campeoes = (
      await Promise.all(lista.map(async (c) => ({ competicao: c, clube: await this.campeao(c) })))
    ).filter((x) => x.clube);

    return {
      temporada,
      principal,
      competicoes: lista,
      clubes: clubes.map((c) => ({ ...c, elenco: elencos.filter((e) => e.clubeId === c.id) })),
      destaque: destaque
        ? { jogo: destaque, tipo: proximo ? ("proximo" as const) : ("resultado" as const), competicao: lista.find((c) => c.id === destaque.competicaoId)! }
        : null,
      inscricoes: lista
        .map((c) => ({ competicao: c, situacao: situacaoInscricao(agora, c) }))
        .filter((i) => i.competicao.status === "inscricoes"),
      campeoes,
    };
  }

  /** Aba "Tabela": classificação ou chave, jogos da rodada, suspensos, rankings e notícias. */
  async tabela(competicaoId: number | null, rodadaNumero?: number) {
    const { lista } = await this.competicoes();
    const atual = lista.find((c) => c.id === competicaoId) ?? lista[0] ?? null;
    const noticias = await siteRepo.noticiasPublicadas(this.db, 3);
    if (!atual) return { competicoes: lista, atual: null, noticias };

    const cls = new ClassificacaoController(this.db);
    const rankings = await cls.rankings(atual.id, 5);

    if (atual.tipo === "copa") {
      const todas = await partidasRepo.daCompeticao(this.db, atual.id);
      const jogos = await this.comNomes(todas.map((t) => t.partida));
      const fases = [...new Map(todas.map((t) => [t.rodadaNumero, t.rodadaNome])).entries()].map(([numero, nome]) => ({
        numero,
        nome,
        jogos: jogos.filter((j) => todas.find((t) => t.partida.id === j.id)?.rodadaNumero === numero),
      }));
      return { competicoes: lista, atual, noticias, rankings, tipo: "copa" as const, fases, campeao: await this.campeao(atual) };
    }

    const [classificacao, rodada] = await Promise.all([
      cls.classificacao(atual.id),
      new PartidaController(this.db).rodada(atual.id, rodadaNumero),
    ]);
    const suspensos = rodada ? await siteRepo.suspensos(this.db, rodada.partidas.map((p) => p.id)) : [];
    const nomesSusp = await nomesRepo.clubes(this.db, suspensos.map((s) => s.clubeId));
    return {
      competicoes: lista,
      atual,
      noticias,
      rankings,
      tipo: "liga" as const,
      classificacao,
      rodada,
      suspensos: suspensos.map((s) => ({ ...s, clube: nomesSusp.get(s.clubeId)?.nome ?? "" })),
      campeao: await this.campeao(atual),
    };
  }

  /** Aba "Regulamento". */
  async regulamento() {
    const paginas = new PaginaController(this.db);
    const [regulamento, proibidos] = await Promise.all([paginas.buscar("regulamento"), paginas.buscar("proibidos")]);
    return { regulamento, proibidos };
  }
}
