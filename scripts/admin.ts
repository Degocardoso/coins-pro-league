// npm run admin:criar -- email@exemplo.com "Seu nome"      cria um admin com senha gerada
// npm run admin:senha -- email@exemplo.com                 gera uma senha nova para um admin
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../src/models/db";
import { admins } from "../src/models/schema";
import { AuthController } from "../src/controllers/AuthController";
import { gerarHashSenha } from "../src/lib/seguranca";

const [comando, email, nome] = process.argv.slice(2);
const senha = randomBytes(12).toString("base64url"); // 16 caracteres
const db = getDb();

if (!email || !email.includes("@")) {
  console.error("Informe o e-mail. Ex.: npm run admin:criar -- voce@email.com \"Seu nome\"");
  process.exit(1);
}

if (comando === "criar") {
  await new AuthController(db).criar({ nome: nome || email.split("@")[0], email, senha });
  console.log(`Admin criado: ${email}`);
} else if (comando === "senha") {
  const r = await db
    .update(admins)
    .set({ senhaHash: await gerarHashSenha(senha) })
    .where(eq(admins.email, email.trim().toLowerCase()))
    .returning({ id: admins.id });
  if (!r.length) {
    console.error("Nenhum admin com esse e-mail.");
    process.exit(1);
  }
  console.log(`Senha redefinida: ${email}`);
}
console.log(`Senha: ${senha}\nGuarde agora: ela não aparece de novo.`);
process.exit(0);
