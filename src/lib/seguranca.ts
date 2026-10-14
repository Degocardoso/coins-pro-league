// Senhas (scrypt) e token de sessão assinado (HMAC), só com o crypto do Node.
import { createHash, createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const scryptAsync = (senha: string, sal: Buffer, tamanho: number) =>
  new Promise<Buffer>((ok, erro) => scrypt(senha, sal, tamanho, (e, chave) => (e ? erro(e) : ok(chave))));

export async function gerarHashSenha(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const chave = await scryptAsync(senha, sal, 64);
  return `scrypt$${sal.toString("base64url")}$${chave.toString("base64url")}`;
}

export async function conferirSenha(senha: string, hash: string): Promise<boolean> {
  const [alg, salB64, chaveB64] = hash.split("$");
  if (alg !== "scrypt" || !salB64 || !chaveB64) return false;
  const esperada = Buffer.from(chaveB64, "base64url");
  const calculada = await scryptAsync(senha, Buffer.from(salB64, "base64url"), esperada.length);
  return timingSafeEqual(esperada, calculada);
}

export type DadosSessao = { adminId: number; expiraEm: number };

const assinar = (dados: string, segredo: string) => createHmac("sha256", segredo).update(dados).digest("base64url");

export function criarToken(dados: DadosSessao, segredo: string): string {
  const corpo = Buffer.from(JSON.stringify(dados)).toString("base64url");
  return `${corpo}.${assinar(corpo, segredo)}`;
}

/**
 * Lê um token assinado. "duracaoMaxMs" recusa tokens com prazo maior que o permitido hoje
 * (assim, encurtar a sessão também derruba quem logou com a regra antiga).
 */
export function lerToken(token: string | undefined, segredo: string, agora = Date.now(), duracaoMaxMs?: number): DadosSessao | null {
  if (!token) return null;
  const [corpo, assinatura] = token.split(".");
  if (!corpo || !assinatura) return null;
  const esperada = Buffer.from(assinar(corpo, segredo));
  const recebida = Buffer.from(assinatura);
  if (esperada.length !== recebida.length || !timingSafeEqual(esperada, recebida)) return null;
  try {
    const dados = JSON.parse(Buffer.from(corpo, "base64url").toString()) as DadosSessao;
    if (typeof dados.adminId !== "number" || typeof dados.expiraEm !== "number") return null;
    if (dados.expiraEm <= agora) return null;
    if (duracaoMaxMs !== undefined && dados.expiraEm - agora > duracaoMaxMs + 60_000) return null;
    return dados;
  } catch {
    return null;
  }
}

/** Compara duas senhas sem vazar pelo tempo de resposta (os dois lados viram hash do mesmo tamanho). */
export function senhaIgual(digitada: string, configurada: string): boolean {
  const a = createHash("sha256").update(digitada).digest();
  const b = createHash("sha256").update(configurada).digest();
  return timingSafeEqual(a, b);
}
