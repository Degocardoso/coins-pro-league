// CONTROLLER — temporadas e janela de transferências
import type { Db } from "@/models/db";
import { temporadasRepo } from "@/models/repositories/cadastros";

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
}
