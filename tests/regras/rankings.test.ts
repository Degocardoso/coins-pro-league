import { describe, expect, it } from "vitest";
import { calcularRankings, type LinhaEstatistica } from "@/controllers/regras/rankings";

const l = (atletaId: number, extra: Partial<LinhaEstatistica> = {}): LinhaEstatistica => ({
  atletaId, clubeId: 1, gols: 0, golsPenalti: 0, assistencias: 0, mvp: false, goleiro: false, golsSofridosPeloClube: 1, ...extra,
});

describe("rankings", () => {
  it("soma gols, pênaltis, assistências e MVP por atleta", () => {
    const r = calcularRankings([
      l(1, { gols: 2, golsPenalti: 1 }), l(1, { gols: 1, mvp: true }), l(2, { gols: 1, assistencias: 2 }),
    ]);
    expect(r.artilharia.map((i) => [i.atletaId, i.valor])).toEqual([[1, 3], [2, 1]]);
    expect(r.penaltis.map((i) => [i.atletaId, i.valor])).toEqual([[1, 1]]);
    expect(r.assistencias[0]).toMatchObject({ atletaId: 2, valor: 2 });
    expect(r.mvp[0]).toMatchObject({ atletaId: 1, valor: 1 });
  });

  it("jogo sem sofrer gol só conta para o goleiro humano", () => {
    const r = calcularRankings([
      l(1, { goleiro: true, golsSofridosPeloClube: 0 }),
      l(2, { goleiro: false, golsSofridosPeloClube: 0 }),
      l(3, { goleiro: true, golsSofridosPeloClube: 2 }),
    ]);
    expect(r.semSofrerGol.map((i) => i.atletaId)).toEqual([1]);
  });

  it("empate no valor: quem jogou menos fica na frente", () => {
    const r = calcularRankings([l(1, { gols: 2 }), l(1), l(2, { gols: 2 })]);
    expect(r.artilharia.map((i) => i.atletaId)).toEqual([2, 1]);
  });
});
