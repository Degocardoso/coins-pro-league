// Regras de elenco e inscrição (regulamento, seções 4, 5 e 6)

export const ELENCO_MINIMO = 7;
export const ELENCO_MAXIMO = 18;
export const CAPITAES_POR_CLUBE = 2;

export type Janela = { inicio: Date | null; fim: Date | null };

export function dentroDaJanela(agora: Date, janela: Janela): boolean {
  if (!janela.inicio || !janela.fim) return false;
  return agora >= janela.inicio && agora <= janela.fim;
}

/** Elenco montado na inscrição: precisa estar entre 7 e 18 e ter 2 capitães. */
export function validarElencoDeInscricao(qtdAtletas: number, qtdCapitaes: number): string[] {
  const erros: string[] = [];
  if (qtdAtletas < ELENCO_MINIMO) erros.push(`O elenco precisa de no mínimo ${ELENCO_MINIMO} atletas.`);
  if (qtdAtletas > ELENCO_MAXIMO) erros.push(`O elenco pode ter no máximo ${ELENCO_MAXIMO} atletas.`);
  if (qtdCapitaes !== CAPITAES_POR_CLUBE) erros.push(`O clube precisa de exatamente ${CAPITAES_POR_CLUBE} capitães.`);
  return erros;
}

export type ContextoMudancaElenco = {
  agora: Date;
  janela: Janela;
  // true enquanto a temporada ainda não começou (período de inscrição): elenco livre
  antesDoInicio: boolean;
  qtdElencoAtual: number;
};

/** Entrada de atleta no elenco depois da inscrição. */
export function validarEntrada(ctx: ContextoMudancaElenco, atletaJaTemClube: boolean): string[] {
  const erros: string[] = [];
  if (atletaJaTemClube) erros.push("Esse atleta já está inscrito em outro clube nesta temporada.");
  if (!ctx.antesDoInicio && !dentroDaJanela(ctx.agora, ctx.janela))
    erros.push("Fora da janela de transferências: o elenco está congelado.");
  if (ctx.qtdElencoAtual + 1 > ELENCO_MAXIMO) erros.push(`O elenco já tem ${ELENCO_MAXIMO} atletas.`);
  return erros;
}

/** Saída de atleta do elenco. */
export function validarSaida(ctx: ContextoMudancaElenco): string[] {
  const erros: string[] = [];
  if (!ctx.antesDoInicio && !dentroDaJanela(ctx.agora, ctx.janela))
    erros.push("Fora da janela de transferências: o elenco está congelado.");
  if (ctx.qtdElencoAtual - 1 < ELENCO_MINIMO)
    erros.push(`O elenco não pode ficar com menos de ${ELENCO_MINIMO} atletas.`);
  return erros;
}

/**
 * Status de uma inscrição ao ser confirmada: entra se ainda houver vaga,
 * senão vai para a lista de espera.
 */
export function statusAoConfirmar(confirmadasAtuais: number, maxClubes: number): "confirmada" | "espera" {
  return confirmadasAtuais < maxClubes ? "confirmada" : "espera";
}

export type JanelaInscricao = { subInicio: Date | null; inicio: Date | null; fim: Date | null };

/** Inscrição aberta? Clubes com capitão sub podem entrar a partir de subInicio. */
export function inscricaoAberta(agora: Date, j: JanelaInscricao, capitaoSub: boolean): boolean {
  if (!j.fim || agora > j.fim) return false;
  if (j.inicio && agora >= j.inicio) return true;
  return capitaoSub && !!j.subInicio && agora >= j.subInicio;
}
