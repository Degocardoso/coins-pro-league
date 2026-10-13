// CONTROLLER — páginas editáveis (regulamento e lista de práticas proibidas)
import type { Db } from "@/models/db";
import { paginasRepo } from "@/models/repositories/cadastros";
import { REGULAMENTO_OFICIAL } from "@/models/conteudo/regulamento";

export const PAGINAS = {
  regulamento: "Regulamento Oficial",
  proibidos: "Práticas proibidas",
} as const;
export type SlugPagina = keyof typeof PAGINAS;

export class PaginaController {
  constructor(private db: Db) {}

  async buscar(slug: SlugPagina) {
    return (await paginasRepo.buscar(this.db, slug)) ?? { slug, titulo: PAGINAS[slug], conteudo: "", atualizadoEm: null };
  }

  salvar = (slug: SlugPagina, conteudo: string) => paginasRepo.salvar(this.db, slug, PAGINAS[slug], conteudo);

  /** Texto oficial aprovado do regulamento, que vem junto com o projeto. */
  static textoOficial() {
    return REGULAMENTO_OFICIAL;
  }
}
