// CONTROLLER — resumo da tela inicial do admin
import type { Db } from "@/models/db";
import { competicoesAdminRepo, temporadasRepo } from "@/models/repositories/cadastros";

export class PainelController {
  constructor(private db: Db) {}

  async resumo() {
    const temporada = await temporadasRepo.ativa(this.db);
    if (!temporada) return { temporada: null, competicoes: [], inscricoesPendentes: 0 };
    const competicoes = await competicoesAdminRepo.listar(this.db, temporada.id);
    const ids = competicoes.map((c) => c.id);
    const [progresso, inscricoesPendentes] = await Promise.all([
      competicoesAdminRepo.progresso(this.db, ids),
      competicoesAdminRepo.pendentes(this.db, ids),
    ]);
    return {
      temporada,
      inscricoesPendentes,
      competicoes: competicoes.map((c) => ({ ...c, progresso: progresso.get(c.id) ?? { jogadas: 0, total: 0 } })),
    };
  }
}
