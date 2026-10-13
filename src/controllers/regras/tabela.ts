// Regra: gera a tabela da Liga em pontos corridos, ida e volta (método do círculo).
// 16 clubes => 30 rodadas de 8 jogos. O returno espelha o turno com mando invertido,
// então cada clube termina com exatamente o mesmo número de jogos em casa e fora.

export type Confronto = { mandante: number; visitante: number };
export type RodadaGerada = { numero: number; confrontos: Confronto[] };

export function gerarTurnoEReturno(clubeIds: number[]): RodadaGerada[] {
  if (clubeIds.length < 2) throw new Error("A liga precisa de pelo menos 2 clubes");
  if (new Set(clubeIds).size !== clubeIds.length) throw new Error("Clube repetido na lista");

  const times: (number | null)[] = [...clubeIds];
  if (times.length % 2 === 1) times.push(null); // número ímpar: um clube folga por rodada
  const n = times.length;

  const turno: RodadaGerada[] = [];
  let roda = times.slice();

  for (let r = 0; r < n - 1; r++) {
    const confrontos: Confronto[] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = roda[i];
      const b = roda[n - 1 - i];
      if (a === null || b === null) continue;
      // O clube fixo (posição 0) alterna o mando a cada rodada; os demais
      // alternam pela paridade da posição, o que equilibra casa/fora no turno.
      const aEmCasa = i === 0 ? r % 2 === 0 : i % 2 === 1;
      confrontos.push(aEmCasa ? { mandante: a, visitante: b } : { mandante: b, visitante: a });
    }
    turno.push({ numero: r + 1, confrontos });
    // Gira todos menos o primeiro
    roda = [roda[0], roda[n - 1], ...roda.slice(1, n - 1)];
  }

  const returno = turno.map((rodada) => ({
    numero: rodada.numero + turno.length,
    confrontos: rodada.confrontos.map((c) => ({ mandante: c.visitante, visitante: c.mandante })),
  }));

  return [...turno, ...returno];
}
