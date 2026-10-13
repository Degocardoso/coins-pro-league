import { describe, expect, it } from "vitest";
import { calcularClassificacao, type ResultadoTabela } from "@/controllers/regras/classificacao";

const jogo = (m: number, v: number, gm: number, gv: number): ResultadoTabela => ({
  mandanteId: m, visitanteId: v, golsMandante: gm, golsVisitante: gv, wo: null,
});

describe("classificação", () => {
  it("pontua vitória 3, empate 1 e derrota 0", () => {
    const t = calcularClassificacao([1, 2, 3], [jogo(1, 2, 2, 0), jogo(2, 3, 1, 1)]);
    expect(t.map((l) => [l.clubeId, l.pontos])).toEqual([[1, 3], [3, 1], [2, 1]]);
  });

  it("W.O. vale 3x0 e W.O. duplo é derrota por 0x3 para os dois", () => {
    const t = calcularClassificacao([1, 2, 3, 4], [
      { mandanteId: 1, visitanteId: 2, golsMandante: 3, golsVisitante: 0, wo: "mandante_vence" },
      { mandanteId: 3, visitanteId: 4, golsMandante: 0, golsVisitante: 0, wo: "duplo" },
    ]);
    const l = (id: number) => t.find((x) => x.clubeId === id)!;
    expect([l(1).pontos, l(1).saldo]).toEqual([3, 3]);
    expect([l(2).pontos, l(2).saldo]).toEqual([0, -3]);
    expect([l(3).derrotas, l(3).saldo, l(4).derrotas, l(4).saldo]).toEqual([1, -3, 1, -3]);
  });

  it("empate em pontos: mais vitórias fica na frente", () => {
    // 1: uma vitória e uma derrota (3 pts). 2: três empates (3 pts).
    const t = calcularClassificacao([1, 2, 3, 4, 5], [
      jogo(1, 3, 1, 0), jogo(1, 4, 0, 5), jogo(2, 3, 0, 0), jogo(2, 4, 0, 0), jogo(2, 5, 0, 0),
    ]);
    const pos = (id: number) => t.find((x) => x.clubeId === id)!.posicao;
    expect(pos(1)).toBeLessThan(pos(2));
  });

  it("confronto direto desempata quem está igual em tudo", () => {
    // A(1) e B(2): 3 pts, 1 vitória, saldo 0, 2 gols pró. A venceu B.
    const t = calcularClassificacao([1, 2, 3, 4], [jogo(1, 2, 2, 1), jogo(3, 1, 1, 0), jogo(2, 4, 1, 0)]);
    const pos = (id: number) => t.find((x) => x.clubeId === id)!.posicao;
    expect(pos(1)).toBeLessThan(pos(2));
    expect(t.every((l) => !l.precisaSorteio)).toBe(true);
  });

  it("empate total sinaliza sorteio, mas não antes de haver jogos", () => {
    const ciclo = calcularClassificacao([1, 2, 3], [jogo(1, 2, 1, 0), jogo(2, 3, 1, 0), jogo(3, 1, 1, 0)]);
    expect(ciclo.every((l) => l.precisaSorteio)).toBe(true);
    const inicio = calcularClassificacao([1, 2, 3], []);
    expect(inicio.some((l) => l.precisaSorteio)).toBe(false);
  });
});
