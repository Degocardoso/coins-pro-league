// CONTROLLER — competições: gerar tabela da liga, chave da copa e confirmar inscrições
import type { Db } from "@/models/db";
import { competicoesRepo, partidasRepo } from "@/models/repositories";
import { clubesRepo, competicoesAdminRepo } from "@/models/repositories/cadastros";
import { gerarTurnoEReturno } from "./regras/tabela";
import { gerarChave } from "./regras/copa";
import { statusAoConfirmar } from "./regras/elenco";

export type FichaCompeticao = {
  nome: string;
  status: "rascunho" | "inscricoes" | "em_andamento" | "encerrada";
  ativa: boolean;
  maxClubes: number;
  dataInicio: Date | null;
  dataFim: Date | null;
  inscricaoSubInicio: Date | null;
  inscricaoInicio: Date | null;
  inscricaoFim: Date | null;
  taxaCentavos: number | null;
  premio: string | null;
  bannerUrl?: string | null;
};

function validarFicha(f: FichaCompeticao) {
  if (f.nome.length < 3) throw new Error("Dê um nome para a competição");
  if (!Number.isInteger(f.maxClubes) || f.maxClubes < 2 || f.maxClubes > 64)
    throw new Error("Número de clubes precisa ficar entre 2 e 64");
  if (f.dataInicio && f.dataFim && f.dataFim < f.dataInicio) throw new Error("O fim é antes do início");
  if (f.inscricaoInicio && f.inscricaoFim && f.inscricaoFim < f.inscricaoInicio)
    throw new Error("O fim das inscrições é antes do início");
  if (f.inscricaoSubInicio && f.inscricaoInicio && f.inscricaoSubInicio > f.inscricaoInicio)
    throw new Error("A abertura para subs precisa ser antes da abertura geral");
}

export class CompeticaoController {
  constructor(private db: Db) {}

  listar = (temporadaId: number) => competicoesAdminRepo.listar(this.db, temporadaId);
  buscar = (id: number) => competicoesRepo.buscar(this.db, id);

  async criar(temporadaId: number, tipo: "liga" | "copa", nome: string) {
    if (nome.length < 3) throw new Error("Dê um nome para a competição");
    return competicoesAdminRepo.criar(this.db, { temporadaId, tipo, nome, maxClubes: tipo === "liga" ? 16 : 8 });
  }

  async atualizarFicha(id: number, ficha: FichaCompeticao) {
    validarFicha(ficha);
    const { bannerUrl, ...resto } = ficha;
    await competicoesAdminRepo.atualizar(this.db, id, bannerUrl !== undefined ? { ...resto, bannerUrl } : resto);
  }

  async inscricoes(competicaoId: number) {
    return competicoesAdminRepo.inscricoesComClubes(this.db, competicaoId);
  }

  async inscreverClube(competicaoId: number, clubeId: number) {
    if (!(await clubesRepo.buscar(this.db, clubeId))) throw new Error("Clube não encontrado");
    if (await partidasRepo.existemNaCompeticao(this.db, competicaoId))
      throw new Error("A tabela já foi gerada: não dá para inscrever mais clubes");
    await competicoesAdminRepo.inscrever(this.db, competicaoId, clubeId);
  }

  async alterarInscricao(inscricaoId: number, dados: { pago?: boolean; capitaoSub?: boolean }) {
    await competicoesRepo.atualizarInscricao(this.db, inscricaoId, dados);
  }

  async recusarInscricao(inscricaoId: number, motivo: string) {
    if (!motivo) throw new Error("Informe o motivo da recusa");
    await competicoesRepo.atualizarInscricao(this.db, inscricaoId, { status: "recusada", motivoRecusa: motivo });
  }

  async voltarParaPendente(inscricaoId: number) {
    await competicoesRepo.atualizarInscricao(this.db, inscricaoId, { status: "pendente", motivoRecusa: null });
  }

  async removerInscricao(competicaoId: number, inscricaoId: number) {
    if (await partidasRepo.existemNaCompeticao(this.db, competicaoId))
      throw new Error("A tabela já foi gerada: não dá para remover clubes");
    await competicoesAdminRepo.removerInscricao(this.db, inscricaoId);
  }

  /** Liga: gera as rodadas. Copa: gera a chave, na ordem das inscrições ou sorteada. */
  async gerar(competicaoId: number, sortear: boolean) {
    const comp = await competicoesRepo.buscar(this.db, competicaoId);
    if (!comp) throw new Error("Competição não encontrada");
    const confirmados = await competicoesRepo.clubesConfirmados(this.db, competicaoId);
    if (confirmados.length < 2) throw new Error("Confirme pelo menos 2 inscrições antes de gerar");
    if (comp.tipo === "liga") return this.gerarTabelaLiga(competicaoId);
    const ordem = sortear ? embaralhar(confirmados) : confirmados;
    return this.gerarChaveCopa(competicaoId, ordem);
  }

  /** Cria as 30 rodadas (16 clubes) a partir das inscrições confirmadas. */
  async gerarTabelaLiga(competicaoId: number) {
    return this.db.transaction(async (tx) => {
      const comp = await competicoesRepo.buscar(tx, competicaoId);
      if (!comp) throw new Error("Competição não encontrada");
      if (comp.tipo !== "liga") throw new Error("Essa competição não é uma liga");
      if (await partidasRepo.existemNaCompeticao(tx, competicaoId))
        throw new Error("A tabela já foi gerada para esta competição");

      const clubeIds = await competicoesRepo.clubesConfirmados(tx, competicaoId);
      const geradas = gerarTurnoEReturno(clubeIds);

      // Dois inserts no total: todas as rodadas, depois todas as partidas
      const criadas = await partidasRepo.criarRodadas(
        tx,
        geradas.map((r) => ({ competicaoId, numero: r.numero, nome: `Rodada ${r.numero}` })),
      );
      const idDaRodada = new Map(criadas.map((r) => [r.numero, r.id]));
      await partidasRepo.criarPartidas(
        tx,
        geradas.flatMap((r) =>
          r.confrontos.map((c, i) => ({
            competicaoId,
            rodadaId: idDaRodada.get(r.numero)!,
            ordem: i + 1,
            mandanteId: c.mandante,
            visitanteId: c.visitante,
          })),
        ),
      );
      return { rodadas: geradas.length, partidas: geradas.reduce((s, r) => s + r.confrontos.length, 0) };
    });
  }

  /**
   * Cria a chave da copa. ordemClubes = ordem do sorteio; sem ela, usa a ordem
   * das inscrições confirmadas.
   */
  async gerarChaveCopa(competicaoId: number, ordemClubes?: number[]) {
    return this.db.transaction(async (tx) => {
      const comp = await competicoesRepo.buscar(tx, competicaoId);
      if (!comp) throw new Error("Competição não encontrada");
      if (comp.tipo !== "copa") throw new Error("Essa competição não é uma copa");
      if (await partidasRepo.existemNaCompeticao(tx, competicaoId))
        throw new Error("A chave já foi gerada para esta copa");

      const confirmados = await competicoesRepo.clubesConfirmados(tx, competicaoId);
      const ordem = ordemClubes ?? confirmados;
      const fora = ordem.filter((id) => !confirmados.includes(id));
      if (fora.length || ordem.length !== confirmados.length)
        throw new Error("A ordem do sorteio precisa ter exatamente os clubes confirmados");

      const fases = gerarChave(ordem);
      const idPorPosicao = new Map<string, number>();

      for (const fase of fases) {
        const rodada = await partidasRepo.criarRodada(tx, competicaoId, fase.numero, fase.nome);
        for (const p of fase.partidas) {
          const lado = (v: typeof p.mandante) =>
            "clubeId" in v
              ? { clube: v.clubeId, origem: null }
              : { clube: null, origem: idPorPosicao.get(`${v.vencedorDe.fase}-${v.vencedorDe.ordem}`)! };
          const m = lado(p.mandante);
          const v = lado(p.visitante);
          const criada = await partidasRepo.criarPartida(tx, {
            competicaoId,
            rodadaId: rodada.id,
            ordem: p.ordem,
            mandanteId: m.clube,
            visitanteId: v.clube,
            origemMandanteId: m.origem,
            origemVisitanteId: v.origem,
          });
          idPorPosicao.set(`${p.fase}-${p.ordem}`, criada.id);
        }
      }
      return { fases: fases.map((f) => ({ nome: f.nome, partidas: f.partidas.length })) };
    });
  }

  /** Confirma a inscrição se houver vaga; senão, coloca na lista de espera. */
  async confirmarInscricao(inscricaoId: number) {
    return this.db.transaction(async (tx) => {
      const insc = await competicoesRepo.buscarInscricao(tx, inscricaoId);
      if (!insc) throw new Error("Inscrição não encontrada");
      const comp = await competicoesRepo.buscar(tx, insc.competicaoId);
      if (!comp) throw new Error("Competição não encontrada");
      if (comp.taxaCentavos && !insc.pago) throw new Error("Inscrição com taxa: marque o pagamento antes de confirmar");
      const confirmadas = await competicoesRepo.contarConfirmadas(tx, comp.id);
      const status = statusAoConfirmar(confirmadas, comp.maxClubes);
      await competicoesRepo.atualizarInscricao(tx, inscricaoId, { status });
      return status;
    });
  }
}

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
