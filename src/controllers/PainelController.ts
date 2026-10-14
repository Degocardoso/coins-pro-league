// CONTROLLER — resumo da tela inicial do admin
import type { Db } from "@/models/db";
import { competicoesAdminRepo, temporadasRepo } from "@/models/repositories/cadastros";

export class PainelController {
  constructor(private db: Db) {}

  async resumo() {
    const temporada = await temporadasRepo.ativa(this.db);
    if (!temporada) return { temporada: null, competicoes: [], inscricoesPendentes: 0, pendentes: [] };
    const competicoes = await competicoesAdminRepo.listar(this.db, temporada.id);
    const ids = competicoes.map((c) => c.id);
    const [progresso, pendentes] = await Promise.all([
      competicoesAdminRepo.progresso(this.db, ids),
      competicoesAdminRepo.listaPendentes(this.db, ids),
    ]);
    return {
      temporada,
      inscricoesPendentes: pendentes.length,
      pendentes,
      competicoes: competicoes.map((c) => ({ ...c, progresso: progresso.get(c.id) ?? { jogadas: 0, total: 0 } })),
    };
  }

  /** Número para o contador do menu: inscrições esperando análise na temporada ativa. */
  async contarPendentes() {
    const temporada = await temporadasRepo.ativa(this.db);
    if (!temporada) return 0;
    const ids = (await competicoesAdminRepo.listar(this.db, temporada.id)).map((c) => c.id);
    return competicoesAdminRepo.pendentes(this.db, ids);
  }

  /** Inscrições pendentes por competição, para a lista de competições. */
  pendentesPorCompeticao = (ids: number[]) => competicoesAdminRepo.pendentesPorCompeticao(this.db, ids);
}
