// Datas sempre no horário de Brasília, mesmo com o servidor (Vercel) em UTC.
const FUSO = "America/Sao_Paulo";
const OFFSET = "-03:00"; // o Brasil não tem horário de verão desde 2019

/** "2026-10-14T21:30" (input datetime-local) -> Date. Vazio -> null. */
export function deInputLocal(valor: FormDataEntryValue | null): Date | null {
  const v = typeof valor === "string" ? valor.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return null;
  const d = new Date(`${v}:00${OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date -> "2026-10-14T21:30" para preencher um input datetime-local. */
export function paraInputLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const p = new Intl.DateTimeFormat("sv-SE", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return p.replace(" ", "T");
}

/** "qua. 14/10, 21:30" */
export function formatarDataHora(d: Date | null | undefined): string {
  return d ? `${formatarDia(d)}, ${formatarHora(d)}` : "";
}

/** "14/10/2026" */
export function formatarData(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

/** "qua. 14/10" */
export function formatarDia(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "short", day: "2-digit", month: "2-digit" })
    .format(d)
    .replace(",", "");
}

/** "21:30" */
export function formatarHora(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }).format(d);
}

/** "quinta-feira, 15 de outubro de 2026" */
export function formatarDataLonga(d: Date | null | undefined): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
}
