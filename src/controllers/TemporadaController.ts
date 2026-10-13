// CONTROLLER — temporadas e janela de transferências
import type { Db } from "@/models/db";
import { exclusoesRepo, temporadasRepo } from "@/models/repositories/cadastros";
import { qtd } from "./regras/contagem";

export class TemporadaController {
  constructor(private db: Db) {}

  listar = () => temporadasRepo.listar(this.db);
  ativa = () => temporadasRepo.ativa(this.db);

  async criar(numero: number, nome: string) {
    if (!Number.isInteger(numero) || numero < 1) throw new Error("Número da temporada inválido");
    if (!nome) throw new Error("Dê um nome para a temporada");
    const t = await temporadasRepo.criar(this.db, { numero, nome });
    if (!(await temporadasRepo.ativa(this.db))) await temporadasRepo.ativar(this.db, t.id);
    return t;
  }

  async definirJanela(id: number, inicio: Date | null, fim: Date | null) {
    if (inicio && fim && fim <= inicio) throw new Error("O fim da janela precisa ser depois do início");
    await temporadasRepo.atualizar(this.db, id, { janelaInicio: inicio, janelaFim: fim });
  }

  ativar = (id: number) => temporadasRepo.ativar(this.db, id);

  async editar(id: number, numero: number, nome: string) {
    if (!Number.isInteger(numero) || numero < 1) throw new Error("Número da temporada inválido");
    if (!nome) throw new Error("Dê um nome para a temporada");
    const outra = await exclusoesRepo.temporadaPorNumero(this.db, numero);
    if (outra && outra.id !== id) throw new Error(`Já existe a temporada número ${numero}`);
    await temporadasRepo.atualizar(this.db, id, { numero, nome });
  }

  /** Só exclui temporada vazia: sem competições e sem atletas em elencos. */
  async excluir(id: number) {
    const [comps, elencos] = await Promise.all([
      qtd(exclusoesRepo.competicoesDaTemporada(this.db, id)),
      qtd(exclusoesRepo.vinculosDaTemporada(this.db, id)),
    ]);
    if (comps || elencos)
      throw new Error(
        `Essa temporada tem ${comps} competição(ões) e ${elencos} atleta(s) em elencos. Para excluir, ela precisa estar vazia.`,
      );
    await exclusoesRepo.excluirTemporada(this.db, id);
  }
}
