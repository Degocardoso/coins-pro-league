import { describe, expect, it } from "vitest";
import { gerarSuspensoes, validarResultado, type EstatisticaLancada, type ResultadoLancado } from "@/controllers/regras/resultado";

const est = (atletaId: number, clubeId: number, extra: Partial<EstatisticaLancada> = {}): EstatisticaLancada => ({
  atletaId, clubeId, gols: 0, golsPenalti: 0, assistencias: 0, mvp: false, goleiro: false, cartaoVermelho: false, ...extra,
});
// Clube 1: atletas 11..15 · Clube 2: atletas 21..25
const elenco = (c: number) => new Set([1, 2, 3, 4, 5].map((i) => c * 10 + i));
const escalacao = (c: number) => [1, 2, 3, 4, 5].map((i) => est(c * 10 + i, c));
const ctx = { elencoMandante: elenco(1), elencoVisitante: elenco(2), suspensosNestaPartida: new Set<number>(), nomeAtleta: (id: number) => `#${id}` };
const base = (r: Partial<ResultadoLancado> = {}): ResultadoLancado => ({
  tipoCompeticao: "liga", mandanteId: 1, visitanteId: 2, golsMandante: 2, golsVisitante: 1,
  prorrogacao: false, penaltisMandante: null, penaltisVisitante: null,
  estatisticas: [...escalacao(1), ...escalacao(2)], ...r,
});

describe("validação do resultado", () => {
  it("resultado correto passa sem erros nem alertas", () => {
    expect(validarResultado(base(), ctx)).toEqual({ erros: [], alertas: [] });
  });

  it("liga não tem pênaltis; copa empatada exige pênaltis e prorrogação", () => {
    expect(validarResultado(base({ penaltisMandante: 4, penaltisVisitante: 3 }), ctx).erros.length).toBeGreaterThan(0);
    const copa = base({ tipoCompeticao: "copa", golsMandante: 1, golsVisitante: 1 });
    expect(validarResultado(copa, ctx).erros).toContain("Copa empatada: informe o placar dos pênaltis.");
    const ok = { ...copa, prorrogacao: true, penaltisMandante: 5, penaltisVisitante: 4 };
    expect(validarResultado(ok, ctx).erros).toEqual([]);
  });

  it("gols dos atletas não passam do placar e há só um MVP", () => {
    const e = [...escalacao(1), ...escalacao(2)];
    e[0] = est(11, 1, { gols: 3, mvp: true });
    e[5] = est(21, 2, { mvp: true });
    const r = validarResultado(base({ estatisticas: e }), ctx);
    expect(r.erros).toContain("Os atletas do mandante somam mais gols que o placar.");
    expect(r.erros).toContain("Só pode haver um MVP por partida.");
  });

  it("pênalti não pode passar do total de gols do atleta", () => {
    const e = [...escalacao(1), ...escalacao(2)];
    e[0] = est(11, 1, { gols: 1, golsPenalti: 2 });
    expect(validarResultado(base({ estatisticas: e }), ctx).erros).toHaveLength(1);
  });

  it("atleta irregular, suspenso e menos de 5 humanos geram alerta", () => {
    const e = [...escalacao(1).slice(0, 4), est(99, 1), ...escalacao(2)];
    const r = validarResultado(base({ estatisticas: e }), { ...ctx, suspensosNestaPartida: new Set([21]) });
    expect(r.erros).toEqual([]);
    expect(r.alertas).toEqual(["Atleta irregular: #99 não está inscrito nesse clube.", "Atleta irregular: #21 estava suspenso."]);
    const poucos = validarResultado(base({ estatisticas: [...escalacao(1).slice(0, 4), ...escalacao(2)] }), ctx);
    expect(poucos.alertas).toEqual(["O mandante tem 4 atletas lançados; o mínimo para jogar é 5."]);
  });

  it("cartão vermelho gera 1 partida de suspensão na próxima do clube", () => {
    const e = [est(11, 1, { cartaoVermelho: true }), est(21, 2)];
    expect(gerarSuspensoes(e, (c) => (c === 1 ? 77 : null))).toEqual([{ atletaId: 11, cumprirPartidaId: 77 }]);
  });
});
