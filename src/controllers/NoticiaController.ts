// CONTROLLER — jornal da liga
import type { Db } from "@/models/db";
import { noticiasRepo } from "@/models/repositories/cadastros";

export type DadosNoticia = { titulo: string; texto: string; imagemUrl?: string | null; publicada: boolean };

function validar(d: DadosNoticia) {
  if (d.titulo.length < 3) throw new Error("Escreva um título");
  if (d.titulo.length > 120) throw new Error("Título com mais de 120 caracteres");
  if (d.texto.length < 3) throw new Error("Escreva o texto da notícia");
}

export class NoticiaController {
  constructor(private db: Db) {}
  listar = () => noticiasRepo.listar(this.db);
  buscar = (id: number) => noticiasRepo.buscar(this.db, id);
  async criar(d: DadosNoticia) {
    validar(d);
    return noticiasRepo.criar(this.db, { ...d, imagemUrl: d.imagemUrl ?? null });
  }
  async atualizar(id: number, d: DadosNoticia) {
    validar(d);
    const { imagemUrl, ...resto } = d;
    await noticiasRepo.atualizar(this.db, id, imagemUrl !== undefined ? { ...resto, imagemUrl } : resto);
  }
  excluir = (id: number) => noticiasRepo.excluir(this.db, id);
}
