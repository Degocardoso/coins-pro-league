// CONTROLLER — imagens enviadas no admin
import type { Db } from "@/models/db";
import { arquivosRepo } from "@/models/repositories/cadastros";
import { validarImagem } from "@/lib/imagem";

export class ArquivoController {
  constructor(private db: Db) {}

  /** Salva a imagem do campo de upload. Sem arquivo escolhido, devolve null. */
  async salvarImagem(entrada: FormDataEntryValue | null): Promise<{ url: string } | { erro: string } | null> {
    if (!(entrada instanceof File) || entrada.size === 0) return null;
    const bytes = Buffer.from(await entrada.arrayBuffer());
    const v = validarImagem(bytes);
    if ("erro" in v) return v;
    const id = await arquivosRepo.salvar(this.db, { nome: entrada.name.slice(0, 200), mime: v.tipo, bytes });
    return { url: `/arquivos/${id}` };
  }

  buscar = (id: string) => arquivosRepo.buscar(this.db, id);
}
