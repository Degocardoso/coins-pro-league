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
