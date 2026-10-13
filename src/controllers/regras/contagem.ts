// Ajuda: lê o resultado de um count(*) do banco
export const qtd = async (consulta: Promise<{ n: number }[]>) => (await consulta)[0]?.n ?? 0;
