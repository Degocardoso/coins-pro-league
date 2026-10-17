// Estado devolvido pelas ações para a tela (mensagem de sucesso, erros e alertas)
// segredo: senha gerada, mostrada numa janela uma vez só (Equipe)
// discord: convite da liga, mostrado ao capitão logo depois da inscrição
export type Estado = { ok?: string; erros?: string[]; alertas?: string[]; segredo?: { titulo: string; valor: string }; discord?: string } | null;

type ErroDoBanco = { code?: string; message?: string };

/**
 * Erro de regra (lançado pelos controllers) aparece como está.
 * Erro do banco aparece com o motivo real e sem os dados da consulta (que podem ter uma imagem inteira);
 * o erro completo vai para os logs (Vercel > Logs).
 */
export function falha(e: unknown): Estado {
  const causa = (e as { cause?: ErroDoBanco } | null)?.cause;
  const doBanco = !!causa?.code || (e instanceof Error && e.message.startsWith("Failed query"));
  if (!doBanco) return { erros: [e instanceof Error ? e.message : "Algo deu errado. Tente de novo."] };
  console.error(e);
  if (causa?.code === "42P01")
    return { erros: ["Falta uma tabela no banco. No seu PC, na pasta do projeto, rode: npm run db:migrate"] };
  return { erros: [`O banco recusou a operação: ${causa?.message ?? "erro desconhecido"}. O detalhe completo está nos logs da Vercel.`] };
}

export const sucesso = (ok: string, alertas: string[] = []): Estado => ({ ok, alertas });
