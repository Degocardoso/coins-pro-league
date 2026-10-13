// CONTROLLER — clubes, atletas e capitães
import type { Db } from "@/models/db";
import { atletasRepo, clubesRepo, exclusoesRepo, temporadasRepo, vinculosRepo } from "@/models/repositories/cadastros";
import { qtd } from "./regras/contagem";
import { slugificar } from "@/lib/texto";
import { CAPITAES_POR_CLUBE } from "./regras/elenco";
import { ElencoController, type RespostaElenco } from "./ElencoController";

export type NovoAtleta = {
  nomePersonagem: string;
  plataforma: "ps5" | "xbox" | "pc";
  idPlataforma: string;
  twitch?: string | null;
};

export class ClubeController {
  constructor(private db: Db) {}

  async listar(temporadaId: number | null) {
    const [lista, tamanhos] = await Promise.all([
      clubesRepo.listar(this.db),
      temporadaId ? clubesRepo.tamanhosDosElencos(this.db, temporadaId) : Promise.resolve(new Map<number, number>()),
    ]);
    return lista.map((c) => ({ ...c, elenco: tamanhos.get(c.id) ?? 0 }));
  }

  async detalhe(id: number, temporadaId: number | null) {
    const clube = await clubesRepo.buscar(this.db, id);
    if (!clube) return null;
    const elenco = temporadaId ? await atletasRepo.elencoAtivo(this.db, temporadaId, id) : [];
    return { clube, elenco };
  }

  async criar(nome: string, escudoUrl: string | null) {
    if (nome.length < 2) throw new Error("Nome do clube muito curto");
    if (await clubesRepo.porNome(this.db, nome)) throw new Error("Já existe um clube com esse nome");
    return clubesRepo.criar(this.db, { nome, slug: slugificar(nome), escudoUrl });
  }

  async atualizar(id: number, nome: string, escudoUrl?: string | null) {
    const outro = await clubesRepo.porNome(this.db, nome);
    if (outro && outro.id !== id) throw new Error("Já existe um clube com esse nome");
    await clubesRepo.atualizar(this.db, id, {
      nome,
      slug: slugificar(nome),
      ...(escudoUrl !== undefined ? { escudoUrl } : {}),
    });
  }

  /** Cadastra o atleta (ou reaproveita, se o nome já existir) e coloca no elenco. */
  async adicionarAtleta(
    temporadaId: number,
    clubeId: number,
    dados: NovoAtleta,
    // elencoInicial: elenco enviado na inscrição de um clube novo. Não é transferência,
    // então a janela não se aplica (a regra de um clube por atleta continua valendo).
    opcoes: { capitao?: boolean; elencoInicial?: boolean } = {},
  ): Promise<RespostaElenco> {
    if (dados.nomePersonagem.length < 2) return { ok: false, erros: ["Informe o nome do personagem."] };
    if (!dados.idPlataforma) return { ok: false, erros: ["Informe o ID da plataforma."] };
    let atleta = await atletasRepo.porNome(this.db, dados.nomePersonagem);
    if (atleta && (atleta.plataforma !== dados.plataforma || atleta.idPlataforma !== dados.idPlataforma))
      return { ok: false, erros: ["Já existe um atleta com esse nome de personagem e outro ID de plataforma."] };
    try {
      atleta ??= await atletasRepo.criar(this.db, { ...dados, twitch: dados.twitch || null });
    } catch {
      return { ok: false, erros: ["Esse ID de plataforma já está cadastrado com outro nome de personagem."] };
    }
    const antesDoInicio = opcoes.elencoInicial || !(await temporadasRepo.jaComecou(this.db, temporadaId));
    return new ElencoController(this.db).adicionar(temporadaId, clubeId, atleta.id, { antesDoInicio, capitao: opcoes.capitao });
  }

  async removerAtleta(temporadaId: number, clubeId: number, atletaId: number): Promise<RespostaElenco> {
    const antesDoInicio = !(await temporadasRepo.jaComecou(this.db, temporadaId));
    return new ElencoController(this.db).remover(temporadaId, clubeId, atletaId, { antesDoInicio });
  }

  /** Exclui o clube. Bloqueia se ele já estiver na tabela de alguma competição. */
  async excluir(id: number) {
    const clube = await clubesRepo.buscar(this.db, id);
    if (!clube) throw new Error("Clube não encontrado");
    if (await qtd(exclusoesRepo.partidasDoClube(this.db, id)))
      throw new Error(
        `O ${clube.nome} já está na tabela de uma competição. Apague a tabela dessa competição antes de excluir o clube.`,
      );
    await this.db.transaction(async (tx) => {
      const elenco = await exclusoesRepo.excluirClube(tx, id);
      await exclusoesRepo.apagarAtletasSoltos(tx, elenco);
    });
    return clube.nome;
  }

  /** Corrige os dados de um atleta (erro de digitação na inscrição, por exemplo). */
  async editarAtleta(atletaId: number, dados: NovoAtleta) {
    const nome = dados.nomePersonagem.trim();
    const idPlataforma = dados.idPlataforma.trim();
    if (nome.length < 2 || nome.length > 40) throw new Error("O nome do personagem precisa ter entre 2 e 40 caracteres.");
    if (!idPlataforma) throw new Error("Informe o ID da plataforma.");
    const atual = await exclusoesRepo.buscarAtleta(this.db, atletaId);
    if (!atual) throw new Error("Atleta não encontrado");
    const mesmoNome = await atletasRepo.porNome(this.db, nome);
    if (mesmoNome && mesmoNome.id !== atletaId) throw new Error(`Já existe outro atleta com o personagem "${nome}".`);
    const mesmoId = await exclusoesRepo.atletaPorPlataforma(this.db, dados.plataforma, idPlataforma);
    if (mesmoId && mesmoId.id !== atletaId) throw new Error(`Esse ID já é de outro atleta (${mesmoId.nomePersonagem}).`);
    await atletasRepo.atualizar(this.db, atletaId, {
      nomePersonagem: nome,
      plataforma: dados.plataforma,
      idPlataforma,
      twitch: dados.twitch?.trim() || null,
    });
  }

  /** Exclui o atleta do sistema. Quem já tem jogo registrado não pode sumir das estatísticas: use Liberar. */
  async excluirAtleta(atletaId: number) {
    const atleta = await exclusoesRepo.buscarAtleta(this.db, atletaId);
    if (!atleta) throw new Error("Atleta não encontrado");
    if (await qtd(exclusoesRepo.estatisticasDoAtleta(this.db, atletaId)))
      throw new Error(`${atleta.nomePersonagem} já tem jogos registrados. Para tirar do clube, use Liberar.`);
    await this.db.transaction((tx) => exclusoesRepo.excluirAtleta(tx, atletaId));
    return atleta.nomePersonagem;
  }

  async definirCapitao(vinculoId: number, capitao: boolean) {
    const v = await vinculosRepo.buscar(this.db, vinculoId);
    if (!v || v.saidaEm) throw new Error("Atleta não está no elenco");
    if (capitao) {
      const elenco = await atletasRepo.elencoAtivo(this.db, v.temporadaId, v.clubeId);
      const capitaes = elenco.filter((e) => e.vinculo.capitao && e.vinculo.id !== vinculoId).length;
      if (capitaes >= CAPITAES_POR_CLUBE) throw new Error(`O clube já tem ${CAPITAES_POR_CLUBE} capitães`);
    }
    await vinculosRepo.definirCapitao(this.db, vinculoId, capitao);
  }
}
