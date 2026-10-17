// CONTROLLER — link de convite do Discord da liga (aparece para o capitão logo depois da inscrição)
import type { Db } from "@/models/db";
import { configuracoesRepo } from "@/models/repositories/cadastros";
import { normalizarConviteDiscord } from "@/lib/discord";

export const CHAVE_DISCORD = "discord_convite";

export class DiscordController {
  constructor(private db: Db) {}

  async convite(): Promise<string | null> {
    const c = await configuracoesRepo.ler(this.db, CHAVE_DISCORD);
    return typeof c?.valor === "string" && c.valor ? c.valor : null;
  }

  /** Salva o convite (vazio remove). Devolve o link no formato curto. */
  async definir(entrada: string, adminId: number) {
    if (!entrada.trim()) {
      await configuracoesRepo.gravar(this.db, CHAVE_DISCORD, "", adminId);
      return null;
    }
    const link = normalizarConviteDiscord(entrada);
    if (!link) throw new Error("Link de convite inválido. Use um link como https://discord.gg/abc123.");
    await configuracoesRepo.gravar(this.db, CHAVE_DISCORD, link, adminId);
    return link;
  }
}
