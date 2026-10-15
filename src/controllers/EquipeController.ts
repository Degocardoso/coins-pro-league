// CONTROLLER — equipe do painel: quem tem acesso e a quais áreas. Só o dono usa.
import { randomBytes } from "node:crypto";
import type { Db } from "@/models/db";
import { adminsRepo } from "@/models/repositories/cadastros";
import { gerarHashSenha } from "@/lib/seguranca";
import { areasValidas, CHAVES_AREAS } from "@/lib/acesso";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Senha gerada: 16 caracteres aleatórios (mostrada uma vez só). */
export const gerarSenha = () => randomBytes(12).toString("base64url");

export class EquipeController {
  constructor(private db: Db) {}

  listar = () => adminsRepo.listar(this.db);

  /** Cria a pessoa com senha gerada. Devolve a senha para mostrar uma vez. */
  async criar(dados: { nome: string; email: string; areas: unknown[] }) {
    const nome = dados.nome.trim();
    const email = dados.email.trim().toLowerCase();
    if (nome.length < 2 || nome.length > 60) throw new Error("O nome precisa ter entre 2 e 60 caracteres.");
    if (!EMAIL.test(email)) throw new Error("E-mail inválido.");
    if (await adminsRepo.porEmail(this.db, email)) throw new Error("Já existe alguém com esse e-mail na equipe.");
    const areas = areasValidas(dados.areas);
    if (!areas.length) throw new Error("Marque pelo menos uma área.");
    const senha = gerarSenha();
    const admin = await adminsRepo.criar(this.db, { nome, email, senhaHash: await gerarHashSenha(senha), areas });
    return { admin, senha };
  }

  async atualizarAcesso(id: number, dados: { nome: string; areas: unknown[] }) {
    const alvo = await this.buscar(id);
    if (alvo.dono) throw new Error("O dono tem acesso a tudo: não dá para mudar o acesso dele.");
    const nome = dados.nome.trim();
    if (nome.length < 2 || nome.length > 60) throw new Error("O nome precisa ter entre 2 e 60 caracteres.");
    const areas = areasValidas(dados.areas);
    if (!areas.length) throw new Error("Marque pelo menos uma área. Para tirar todo o acesso, remova a pessoa.");
    await adminsRepo.atualizarAcesso(this.db, id, { nome, areas });
    return alvo.nome;
  }

  /** Senha nova gerada; as sessões abertas da pessoa caem na hora. */
  async gerarNovaSenha(id: number) {
    const alvo = await this.buscar(id);
    const senha = gerarSenha();
    await adminsRepo.trocarSenha(this.db, id, await gerarHashSenha(senha));
    return { nome: alvo.nome, senha };
  }

  async remover(id: number) {
    const alvo = await this.buscar(id);
    if (alvo.dono) throw new Error("O dono não pode ser removido.");
    await adminsRepo.remover(this.db, id);
    return alvo.nome;
  }

  private async buscar(id: number) {
    const alvo = await adminsRepo.porId(this.db, id);
    if (!alvo) throw new Error("Essa pessoa não está mais na equipe.");
    return alvo;
  }
}

export { CHAVES_AREAS };
