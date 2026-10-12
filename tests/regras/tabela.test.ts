import { describe, expect, it } from "vitest";
import { gerarTurnoEReturno } from "@/controllers/regras/tabela";

const ids = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

describe("tabela da liga", () => {
  it("16 clubes: 30 rodadas de 8 jogos, cada confronto uma vez em cada mando", () => {
    const rodadas = gerarTurnoEReturno(ids(16));
    expect(rodadas).toHaveLength(30);
    expect(rodadas.every((r) => r.confrontos.length === 8)).toBe(true);
    const pares = new Set(rodadas.flatMap((r) => r.confrontos.map((c) => `${c.mandante}-${c.visitante}`)));
    expect(pares.size).toBe(240);
  });

  it("cada clube joga uma vez por rodada e 15 vezes em casa", () => {
    const rodadas = gerarTurnoEReturno(ids(16));
    for (const r of rodadas) {
      const clubes = r.confrontos.flatMap((c) => [c.mandante, c.visitante]);
      expect(new Set(clubes).size).toBe(16);
    }
    const casa = new Map<number, number>();
    rodadas.flatMap((r) => r.confrontos).forEach((c) => casa.set(c.mandante, (casa.get(c.mandante) ?? 0) + 1));
    expect([...casa.values()].every((v) => v === 15)).toBe(true);
  });

  it("número ímpar de clubes: um folga por rodada", () => {
    const rodadas = gerarTurnoEReturno(ids(5));
    expect(rodadas).toHaveLength(10);
    expect(rodadas.every((r) => r.confrontos.length === 2)).toBe(true);
  });

  it("recusa lista inválida", () => {
    expect(() => gerarTurnoEReturno([1])).toThrow();
    expect(() => gerarTurnoEReturno([1, 2, 2])).toThrow();
  });
});
