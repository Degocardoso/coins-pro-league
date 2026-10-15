// npm run admin:criar -- email@exemplo.com "Seu nome"   cria uma pessoa com senha gerada (a primeira vira dona)
// npm run admin:senha -- email@exemplo.com              gera uma senha nova (as sessões abertas dela caem)
// npm run admin:dono  -- email@exemplo.com              passa o posto de dono para essa pessoa
// No dia a dia, use a tela Equipe do painel. Estes comandos são para começar e para emergências.
import { getDb } from "../src/models/db";
import { adminsRepo } from "../src/models/repositories/cadastros";
import { gerarHashSenha } from "../src/lib/seguranca";
import { CHAVES_AREAS } from "../src/lib/acesso";
import { gerarSenha } from "../src/controllers/EquipeController";

const [comando, email, nome] = process.argv.slice(2);
const db = getDb();

if (!email) {
  console.error('Informe o e-mail. Ex.: npm run admin:criar -- voce@email.com "Seu nome"');
  process.exit(1);
}
const alvo = await adminsRepo.porEmail(db, email);

if (comando === "criar") {
  if (alvo) {
    console.error(`Já existe alguém com o e-mail ${email}.`);
    process.exit(1);
  }
  const senha = gerarSenha();
  const primeira = !(await adminsRepo.existeDono(db));
  await adminsRepo.criar(db, { nome: nome || email.split("@")[0], email, senhaHash: await gerarHashSenha(senha), dono: primeira, areas: CHAVES_AREAS });
  console.log(`${primeira ? "Dono criado" : "Pessoa criada com todas as áreas"}: ${email}`);
  console.log(`Senha: ${senha}\nGuarde agora: ela não aparece de novo.`);
} else if (comando === "senha") {
  if (!alvo) {
    console.error(`Ninguém com o e-mail ${email}.`);
    process.exit(1);
  }
  const senha = gerarSenha();
  await adminsRepo.trocarSenha(db, alvo.id, await gerarHashSenha(senha));
  console.log(`Senha redefinida: ${email} (sessões abertas encerradas)`);
  console.log(`Senha: ${senha}\nGuarde agora: ela não aparece de novo.`);
} else if (comando === "dono") {
  if (!alvo) {
    console.error(`Ninguém com o e-mail ${email}.`);
    process.exit(1);
  }
  await adminsRepo.definirDono(db, alvo.id);
  console.log(`${alvo.nome} agora é o dono (acesso total e a Equipe).`);
} else {
  console.error("Comandos: criar, senha, dono");
  process.exit(1);
}
process.exit(0);
