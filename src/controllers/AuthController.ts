// CONTROLLER — autenticação dos administradores
import type { Db } from "@/models/db";
import { adminsRepo } from "@/models/repositories/cadastros";
import { conferirSenha, gerarHashSenha } from "@/lib/seguranca";

export const SENHA_MINIMA = 10;

export class AuthController {
  constructor(private db: Db) {}

  async login(email: string, senha: string) {
    const admin = await adminsRepo.porEmail(this.db, email);
    // Confere a senha mesmo sem admin, para não revelar pelo tempo quais e-mails existem
    const ok = await conferirSenha(senha, admin?.senhaHash ?? "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86));
    return admin && ok ? admin : null;
  }

  async criar(dados: { nome: string; email: string; senha: string; papel?: "admin" | "moderador" }) {
    if (dados.senha.length < SENHA_MINIMA) throw new Error(`A senha precisa de pelo menos ${SENHA_MINIMA} caracteres`);
    if (await adminsRepo.porEmail(this.db, dados.email)) throw new Error("Já existe um admin com esse e-mail");
    return adminsRepo.criar(this.db, {
      nome: dados.nome,
      email: dados.email,
      senhaHash: await gerarHashSenha(dados.senha),
      papel: dados.papel ?? "admin",
    });
  }
}
