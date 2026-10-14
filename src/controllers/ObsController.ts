// CONTROLLER — dados das telas do OBS (rodapé, card do gameplay e campeão).
// Só dados públicos: os mesmos que já aparecem no site.
import type { Db } from "@/models/db";
import { nomesRepo, partidasRepo, type Partida } from "@/models/repositories";
import { formatarDataHora } from "@/lib/datas";
import { ClassificacaoController } from "./ClassificacaoController";
import { InscricaoController } from "./InscricaoController";
import { SiteController } from "./SiteController";

type Lado = { nome: string; escudo: string | null } | null;
export type JogoObs = {
  id: number;
  m: Lado;
  v: Lado;
  gm: number | null;
  gv: number | null;
  pm: number | null;
  pv: number | null;
  wo: boolean;
  quando: string | null;
  rodada: string;
  novo: boolean; // resultado lançado há menos de 15 minutos
};

const QUINZE_MINUTOS = 15 * 60 * 1000;

export type DadosObs = Awaited<ReturnType<ObsController["dados"]>>;

const encerrada = (p: Partida) => p.status === "finalizada" || p.status === "wo";

export class ObsController {
  constructor(private db: Db) {}

  async dados(competicaoId: number | null, agora = new Date()) {
    const site = new SiteController(this.db);
    const { lista } = await site.competicoes();
    const comp = lista.find((c) => c.id === competicaoId) ?? lista[0] ?? null;
    const abertas = await new InscricaoController(this.db).abertas(agora);
    const inscricao = abertas[0]
      ? {
          competicao: abertas[0].competicao.nome,
          link: `/i/${abertas[0].competicao.id}`,
          qr: `/obs/qr?c=${abertas[0].competicao.id}`,
          ate: abertas[0].situacao.aberta && abertas[0].situacao.fechaEm ? formatarDataHora(abertas[0].situacao.fechaEm) : null,
        }
      : null;
    if (!comp) return { atualizadoEm: agora.toISOString(), competicao: null, resultados: null, proximos: null, classificacao: [], artilharia: [], inscricao, campeao: null };

    const todas = await partidasRepo.daCompeticao(this.db, comp.id);
    const ids = todas.flatMap((t) => [t.partida.mandanteId, t.partida.visitanteId]).filter((x): x is number => x !== null);
    const nomes = await nomesRepo.clubes(this.db, ids);
    const lado = (id: number | null): Lado => {
      const c = id ? nomes.get(id) : undefined;
      return c ? { nome: c.nome, escudo: c.escudoUrl } : null;
    };
    const jogo = (p: Partida, rodada: string): JogoObs => ({
      id: p.id,
      m: lado(p.mandanteId),
      v: lado(p.visitanteId),
      gm: p.golsMandante,
      gv: p.golsVisitante,
      pm: p.penaltisMandante,
      pv: p.penaltisVisitante,
      wo: p.status === "wo",
      quando: p.dataHora ? formatarDataHora(p.dataHora) : null,
      rodada,
      novo: encerrada(p) && agora.getTime() - p.atualizadoEm.getTime() < QUINZE_MINUTOS,
    });

    // Últimos resultados: os lançados mais recentemente, de qualquer rodada (os capitães marcam os jogos livremente)
    const comResultado = todas.filter((t) => encerrada(t.partida));
    const recentes = [...comResultado]
      .sort((a, b) => b.partida.atualizadoEm.getTime() - a.partida.atualizadoEm.getTime() || b.partida.id - a.partida.id)
      .slice(0, 8);
    const resultados = recentes.length
      ? { titulo: "Últimos resultados", jogos: recentes.map((t) => jogo(t.partida, t.rodadaNome)) }
      : null;

    // Próximos jogos: os marcados a partir de agora; sem nenhum marcado, os da próxima rodada "a combinar"
    const marcados = todas
      .filter((t) => t.partida.status === "agendada" && t.partida.dataHora && t.partida.dataHora >= agora)
      .sort((a, b) => a.partida.dataHora!.getTime() - b.partida.dataHora!.getTime())
      .slice(0, 8);
    const pendente = todas.find((t) => !encerrada(t.partida) && t.partida.mandanteId && t.partida.visitanteId);
    const lista2 = marcados.length
      ? marcados
      : pendente
        ? todas.filter((t) => t.rodadaNumero === pendente.rodadaNumero && !encerrada(t.partida)).slice(0, 8)
        : [];
    const proximos = lista2.length
      ? { titulo: marcados.length ? "Próximos jogos" : `${pendente!.rodadaNome}: a combinar`, jogos: lista2.map((t) => jogo(t.partida, t.rodadaNome)) }
      : null;

    const cls = new ClassificacaoController(this.db);
    const classificacao =
      comp.tipo === "liga" && comResultado.length
        ? (await cls.classificacao(comp.id)).slice(0, 6).map((l) => ({
            pos: l.posicao,
            nome: l.clube.nome,
            escudo: l.clube.escudoUrl,
            pontos: l.pontos,
            jogos: l.jogos,
            saldo: l.saldo,
          }))
        : [];
    const artilharia = (await cls.rankings(comp.id, 5)).artilharia.map((a, i) => ({
      pos: i + 1,
      atleta: a.atleta,
      clube: a.clube.nome,
      escudo: a.clube.escudoUrl,
      gols: a.valor,
    }));
    const vencedor = await site.campeao(comp);
    return {
      atualizadoEm: agora.toISOString(),
      competicao: { id: comp.id, nome: comp.nome, tipo: comp.tipo },
      resultados,
      proximos,
      classificacao,
      artilharia,
      inscricao,
      campeao: vencedor ? { competicao: comp.nome, nome: vencedor.nome, escudo: vencedor.escudoUrl, banner: comp.bannerUrl } : null,
    };
  }
}
