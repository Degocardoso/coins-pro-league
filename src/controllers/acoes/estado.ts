// Estado devolvido pelas ações para a tela (mensagem de sucesso, erros e alertas)
export type Estado = { ok?: string; erros?: string[]; alertas?: string[] } | null;

export const falha = (e: unknown): Estado => ({ erros: [e instanceof Error ? e.message : "Algo deu errado. Tente de novo."] });
export const sucesso = (ok: string, alertas: string[] = []): Estado => ({ ok, alertas });
