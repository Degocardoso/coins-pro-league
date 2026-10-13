// CONTROLLER — inscrição de clube pelo site público (regulamento, seção 4)
import type { Db } from "@/models/db";
import { competicoesRepo } from "@/models/repositories";
import { arquivosRepo, clubesRepo, competicoesAdminRepo, temporadasRepo } from "@/models/repositories/cadastros";
import { ClubeController, type NovoAtleta } from "./ClubeController";
import { situacaoInscricao, validarElencoDeInscricao } from "./regras/elenco";

export type DadosInscricao = {
  competicaoId: number;
  nomeClube: string;
  // Imagem já validada (tipo e tamanho); só é gravada se a inscrição inteira der certo
  escudo: { nome: string; mime: string; bytes: Buffer } | null;
  capitaoSub: boolean;
  twitchCapitao: string | null;
  atletas: (NovoAtleta & { capitao: boolean })[];
};

export type RespostaInscricao = { ok: true; clube: string } | { ok: false; erros: string[] };

class ErroInscricao extends Error {}

export class InscricaoController {
  constructor(private db: Db) {}

  async inscrever(d: DadosInscricao, agora = new Date()): Promise<RespostaInscricao> {
    const comp = await competicoesRepo.buscar(this.db, d.competicaoId);
    if (!comp || !comp.ativa) return { ok: false, erros: ["Competição não encontrada."] };
    const situacao = situacaoInscricao(agora, comp);
    if (!situacao.aberta) return { ok: false, erros: ["As inscrições desta competição não estão abertas."] };
    if (situacao.soSubs && !d.capitaoSub)
      return { ok: false, erros: ["Neste momento, só clubes com capitão sub do canal podem se inscrever."] };

    const erros: string[] = [];
    if (d.nomeClube.length < 2 || d.nomeClube.length > 60) erros.push("O nome do clube precisa ter entre 2 e 60 caracteres.");
    if (!d.escudo) erros.push("Envie o escudo do clube.");
    if (d.capitaoSub && !d.twitchCapitao) erros.push("Informe o usuário da Twitch do capitão sub, para a organização conferir.");
    erros.push(...validarElencoDeInscricao(d.atletas.length, d.atletas.filter((a) => a.capitao).length));
    const repetidos = (lista: string[]) => lista.filter((v, i) => lista.indexOf(v) !== i);
    for (const nome of new Set(repetidos(d.atletas.map((a) => a.nomePersonagem.toLowerCase()))))
      erros.push(`O personagem "${nome}" aparece duas vezes.`);
    for (const id of new Set(repetidos(d.atletas.map((a) => `${a.plataforma}:${a.idPlataforma.toLowerCase()}`))))
      erros.push(`O ID ${id.split(":")[1]} aparece duas vezes.`);
    if (erros.length) return { ok: false, erros };

    try {
      await this.db.transaction(async (tx) => {
        if (await clubesRepo.porNome(tx, d.nomeClube))
          throw new ErroInscricao("Já existe um clube com esse nome. Se é o seu, fale com a organização no Discord.");
        const escudoId = await arquivosRepo.salvar(tx, d.escudo!);
        const clubes = new ClubeController(tx);
        const clube = await clubes.criar(d.nomeClube, `/arquivos/${escudoId}`);
        for (const a of d.atletas) {
          const r = await clubes.adicionarAtleta(
            comp.temporadaId,
            clube.id,
            { ...a, twitch: a.capitao ? d.twitchCapitao : null },
            { capitao: a.capitao, elencoInicial: true },
          );
          if (!r.ok) throw new ErroInscricao(`${a.nomePersonagem}: ${r.erros.join(" ")}`);
        }
        await competicoesAdminRepo.inscrever(tx, comp.id, clube.id);
        const [insc] = (await competicoesAdminRepo.inscricoesComClubes(tx, comp.id)).filter((i) => i.clube.id === clube.id);
        await competicoesRepo.atualizarInscricao(tx, insc.inscricao.id, { capitaoSub: d.capitaoSub });
      });
    } catch (e) {
      if (e instanceof ErroInscricao) return { ok: false, erros: [e.message] };
      throw e;
    }
    return { ok: true, clube: d.nomeClube };
  }

  /** Competições com inscrição aberta agora, para o formulário. */
  async abertas(agora = new Date()) {
    const temporada = await temporadasRepo.ativa(this.db);
    if (!temporada) return [];
    return (await competicoesAdminRepo.listar(this.db, temporada.id))
      .filter((c) => c.ativa)
      .map((c) => ({ competicao: c, situacao: situacaoInscricao(agora, c) }))
      .filter((x) => x.situacao.aberta);
  }
}
