// CONTROLLER — botão "liga na live": com ele desligado, nada da liga aparece nas cenas do OBS
import type { Db } from "@/models/db";
import { adminsRepo, configuracoesRepo } from "@/models/repositories/cadastros";

export const CHAVE_LIGA_NA_LIVE = "liga_na_live";

export class LigaNaLiveController {
  constructor(private db: Db) {}

  /** Ligada por padrão: sem configuração gravada, tudo continua como antes. */
  async ligada() {
    const c = await configuracoesRepo.ler(this.db, CHAVE_LIGA_NA_LIVE);
    return c ? c.valor !== false : true;
  }

  async estado() {
    const c = await configuracoesRepo.ler(this.db, CHAVE_LIGA_NA_LIVE);
    const quem = c?.atualizadoPor ? await adminsRepo.porId(this.db, c.atualizadoPor) : null;
    return { ligada: c ? c.valor !== false : true, atualizadoEm: c?.atualizadoEm ?? null, por: quem?.nome ?? null };
  }

  definir = (ligada: boolean, adminId: number) => configuracoesRepo.gravar(this.db, CHAVE_LIGA_NA_LIVE, ligada, adminId);
}
