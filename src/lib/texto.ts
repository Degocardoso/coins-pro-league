export const slugificar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const texto = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export function inteiro(v: FormDataEntryValue | null): number | null {
  const t = texto(v);
  if (t === "") return null;
  const n = Number(t);
  return Number.isInteger(n) ? n : null;
}

/** "R$ 25,50" ou "25.50" -> 2550 centavos. Vazio -> null. */
export function centavos(v: FormDataEntryValue | null): number | null {
  const t = texto(v).replace(/[^\d,.-]/g, "").replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export const reais = (c: number | null | undefined) =>
  c == null ? "" : (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Resumo para a capa do jornal: parágrafos inteiros do começo do texto, até o limite de caracteres.
 * Se o primeiro parágrafo sozinho passar do limite, ele é cortado no fim de uma palavra.
 * "cortado" diz se ficou texto de fora (para mostrar "Ler a notícia completa").
 */
export function resumir(texto: string, limite: number): { paragrafos: string[]; cortado: boolean } {
  const todos = texto
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  const escolhidos: string[] = [];
  let total = 0;
  for (const p of todos) {
    if (escolhidos.length && total + p.length > limite) break;
    if (!escolhidos.length && p.length > limite) {
      const corte = p.slice(0, limite + 1);
      const ate = corte.lastIndexOf(" ") > limite * 0.6 ? corte.lastIndexOf(" ") : limite;
      return { paragrafos: [p.slice(0, ate).replace(/[\s,;:.–-]+$/, "") + "…"], cortado: true };
    }
    escolhidos.push(p);
    total += p.length;
  }
  return { paragrafos: escolhidos, cortado: escolhidos.length < todos.length };
}
