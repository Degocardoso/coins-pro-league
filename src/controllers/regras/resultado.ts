// Regra: validação do resultado lançado pelo admin (regulamento, seções 8, 10 e 11).
// "erros" impedem salvar. "alertas" salvam, mas avisam a organização
// (ex.: atleta irregular, que pode virar W.O. por decisão dos moderadores).

export const MINIMO_HUMANOS = 5;

export type EstatisticaLancada = {
  atletaId: number;
  clubeId: number;
  gols: number;
  golsPenalti: number;
  assistencias: number;
  mvp: boolean;
  goleiro: boolean;
  cartaoVermelho: boolean;
};

export type ResultadoLancado = {
  tipoCompeticao: "liga" | "copa";
  mandanteId: number;
  visitanteId: number;
  golsMandante: number;
  golsVisitante: number;
  prorrogacao: boolean;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  estatisticas: EstatisticaLancada[];
};

export type ContextoValidacao = {
  elencoMandante: Set<number>;
  elencoVisitante: Set<number>;
  suspensosNestaPartida: Set<number>;
  nomeAtleta: (id: number) => string;
};

const naoNegativo = (n: number) => Number.isInteger(n) && n >= 0;

export function validarResultado(r: ResultadoLancado, ctx: ContextoValidacao) {
  const erros: string[] = [];
  const alertas: string[] = [];

  if (!naoNegativo(r.golsMandante) || !naoNegativo(r.golsVisitante)) erros.push("Placar inválido.");

  const empate = r.golsMandante === r.golsVisitante;
  const temPenaltis = r.penaltisMandante !== null || r.penaltisVisitante !== null;

  if (r.tipoCompeticao === "liga") {
    if (temPenaltis) erros.push("Partida de liga não tem pênaltis.");
    if (r.prorrogacao) erros.push("Partida de liga não tem prorrogação.");
  } else {
    if (empate && !temPenaltis) erros.push("Copa empatada: informe o placar dos pênaltis.");
    if (!empate && temPenaltis) erros.push("Só há pênaltis quando o jogo termina empatado.");
    if (temPenaltis) {
      if (r.penaltisMandante === null || r.penaltisVisitante === null) erros.push("Informe os pênaltis dos dois clubes.");
      else if (!naoNegativo(r.penaltisMandante) || !naoNegativo(r.penaltisVisitante)) erros.push("Placar dos pênaltis inválido.");
      else if (r.penaltisMandante === r.penaltisVisitante) erros.push("Os pênaltis não podem terminar empatados.");
      if (!r.prorrogacao) erros.push("Antes dos pênaltis há prorrogação: marque a prorrogação.");
    }
  }

  const vistos = new Set<number>();
  const porClube = new Map<number, EstatisticaLancada[]>([
    [r.mandanteId, []],
    [r.visitanteId, []],
  ]);

  for (const e of r.estatisticas) {
    const nome = ctx.nomeAtleta(e.atletaId);
    if (vistos.has(e.atletaId)) erros.push(`${nome} aparece duas vezes.`);
    vistos.add(e.atletaId);

    const lista = porClube.get(e.clubeId);
    if (!lista) {
      erros.push(`${nome} está ligado a um clube que não jogou esta partida.`);
      continue;
    }
    lista.push(e);

    if (![e.gols, e.golsPenalti, e.assistencias].every(naoNegativo)) erros.push(`Números inválidos para ${nome}.`);
    if (e.golsPenalti > e.gols) erros.push(`${nome}: gols de pênalti maiores que o total de gols.`);

    const elenco = e.clubeId === r.mandanteId ? ctx.elencoMandante : ctx.elencoVisitante;
    if (!elenco.has(e.atletaId)) alertas.push(`Atleta irregular: ${nome} não está inscrito nesse clube.`);
    if (ctx.suspensosNestaPartida.has(e.atletaId)) alertas.push(`Atleta irregular: ${nome} estava suspenso.`);
  }

  for (const [clubeId, lista] of porClube) {
    const golsClube = clubeId === r.mandanteId ? r.golsMandante : r.golsVisitante;
    const lado = clubeId === r.mandanteId ? "mandante" : "visitante";
    const somaGols = lista.reduce((s, e) => s + e.gols, 0);
    const somaAssist = lista.reduce((s, e) => s + e.assistencias, 0);
    // A diferença entre o placar e a soma dos atletas são gols contra ou gols da IA
    if (somaGols > golsClube) erros.push(`Os atletas do ${lado} somam mais gols que o placar.`);
    if (somaAssist > golsClube) erros.push(`Os atletas do ${lado} somam mais assistências que gols.`);
    if (lista.filter((e) => e.goleiro).length > 1) erros.push(`O ${lado} tem mais de um goleiro marcado.`);
    if (lista.length < MINIMO_HUMANOS)
      alertas.push(`O ${lado} tem ${lista.length} atletas lançados; o mínimo para jogar é ${MINIMO_HUMANOS}.`);
  }

  if (r.estatisticas.filter((e) => e.mvp).length > 1) erros.push("Só pode haver um MVP por partida.");

  return { erros, alertas };
}

/** Jogo sem sofrer gol: só para o goleiro humano, e só se o clube não sofreu gol. */
export function semSofrerGol(e: { goleiro: boolean }, golsSofridosPeloClube: number): boolean {
  return e.goleiro && golsSofridosPeloClube === 0;
}

export type SuspensaoGerada = { atletaId: number; cumprirPartidaId: number | null };

/**
 * Cartão vermelho = 1 partida de suspensão, cumprida na partida seguinte
 * do clube na mesma competição.
 */
export function gerarSuspensoes(
  estatisticas: EstatisticaLancada[],
  proximaPartidaDoClube: (clubeId: number) => number | null,
): SuspensaoGerada[] {
  return estatisticas
    .filter((e) => e.cartaoVermelho)
    .map((e) => ({ atletaId: e.atletaId, cumprirPartidaId: proximaPartidaDoClube(e.clubeId) }));
}
