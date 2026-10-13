import { describe, expect, it } from "vitest";
import { gerarChave, vencedorDaPartida, type ResultadoCopa } from "@/controllers/regras/copa";

describe("chave da copa", () => {
  it("8 clubes: quartas, semi e final, 1º contra 8º", () => {
    const fases = gerarChave([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(fases.map((f) => [f.nome, f.partidas.length])).toEqual([
      ["Quartas de final", 4], ["Semifinal", 2], ["Final", 1],
    ]);
    expect(fases[0].partidas[0]).toMatchObject({ mandante: { clubeId: 1 }, visitante: { clubeId: 8 } });
  });

  it("6 clubes: os dois primeiros folgam e entram na semifinal", () => {
    const fases = gerarChave([1, 2, 3, 4, 5, 6]);
    expect(fases[0].partidas).toHaveLength(2);
    const semi = fases[1].partidas.flatMap((p) => [p.mandante, p.visitante]);
    expect(semi).toContainEqual({ clubeId: 1 });
    expect(semi).toContainEqual({ clubeId: 2 });
  });
});

describe("vencedor da partida de copa", () => {
  const base: ResultadoCopa = {
    mandanteId: 1, visitanteId: 2, golsMandante: null, golsVisitante: null,
    penaltisMandante: null, penaltisVisitante: null, wo: null,
  };
  it("decide no placar (que já inclui a prorrogação)", () => {
    expect(vencedorDaPartida({ ...base, golsMandante: 2, golsVisitante: 3 })).toBe(2);
  });
  it("empate vai para os pênaltis", () => {
    expect(vencedorDaPartida({ ...base, golsMandante: 1, golsVisitante: 1, penaltisMandante: 5, penaltisVisitante: 4 })).toBe(1);
    expect(vencedorDaPartida({ ...base, golsMandante: 1, golsVisitante: 1 })).toBeNull();
  });
  it("W.O. e W.O. duplo", () => {
    expect(vencedorDaPartida({ ...base, wo: "visitante_vence" })).toBe(2);
    expect(vencedorDaPartida({ ...base, wo: "duplo" })).toBeNull();
  });
});
