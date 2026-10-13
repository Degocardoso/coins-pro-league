// CONTROLLER — aba Notícias: capa do jornal (com páginas) e cada notícia
import type { Db } from "@/models/db";
import { temporadasRepo } from "@/models/repositories/cadastros";
import { jornalRepo } from "@/models/repositories/site";

export const NOTICIAS_POR_PAGINA = 13; // a manchete e mais 12

export class JornalController {
  constructor(private db: Db) {}

  async capa(pagina = 1) {
    const total = await jornalRepo.contarPublicadas(this.db);
    const paginas = Math.max(1, Math.ceil(total / NOTICIAS_POR_PAGINA));
    const atual = Math.min(Math.max(1, Math.trunc(pagina) || 1), paginas);
    const [lista, temporada] = await Promise.all([
      jornalRepo.publicadas(this.db, NOTICIAS_POR_PAGINA, (atual - 1) * NOTICIAS_POR_PAGINA),
      temporadasRepo.ativa(this.db),
    ]);
    return { manchete: lista[0] ?? null, demais: lista.slice(1), pagina: atual, paginas, temporada: temporada?.nome ?? null };
  }

  async noticia(id: number) {
    if (!Number.isInteger(id) || id < 1) return null;
    const noticia = await jornalRepo.publicada(this.db, id);
    if (!noticia) return null;
    return { noticia, mais: await jornalRepo.outras(this.db, id, 3) };
  }
}
