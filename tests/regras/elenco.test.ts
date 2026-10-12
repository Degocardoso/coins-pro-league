import { describe, expect, it } from "vitest";
import {
  inscricaoAberta, statusAoConfirmar, validarElencoDeInscricao, validarEntrada, validarSaida,
} from "@/controllers/regras/elenco";

const janela = { inicio: new Date("2026-12-01"), fim: new Date("2026-12-08") };
const ctx = (agora: string, qtd: number) => ({ agora: new Date(agora), janela, antesDoInicio: false, qtdElencoAtual: qtd });

describe("elenco", () => {
  it("inscrição exige de 7 a 18 atletas e 2 capitães", () => {
    expect(validarElencoDeInscricao(7, 2)).toEqual([]);
    expect(validarElencoDeInscricao(6, 2)).toHaveLength(1);
    expect(validarElencoDeInscricao(19, 1)).toHaveLength(2);
  });

  it("fora da janela o elenco fica congelado", () => {
    expect(validarEntrada(ctx("2026-11-20", 10), false)).toHaveLength(1);
    expect(validarEntrada(ctx("2026-12-03", 10), false)).toEqual([]);
    expect(validarSaida(ctx("2026-11-20", 10))).toHaveLength(1);
  });

  it("atleta em outro clube, elenco cheio e elenco mínimo", () => {
    expect(validarEntrada(ctx("2026-12-03", 10), true)).toHaveLength(1);
    expect(validarEntrada(ctx("2026-12-03", 18), false)).toHaveLength(1);
    expect(validarSaida(ctx("2026-12-03", 7))).toHaveLength(1);
  });

  it("antes do início da temporada o elenco é livre", () => {
    expect(validarEntrada({ ...ctx("2026-11-20", 10), antesDoInicio: true }, false)).toEqual([]);
  });

  it("16 vagas, o resto vai para a lista de espera", () => {
    expect(statusAoConfirmar(15, 16)).toBe("confirmada");
    expect(statusAoConfirmar(16, 16)).toBe("espera");
  });

  it("capitão sub entra antes na inscrição", () => {
    const j = { subInicio: new Date("2026-11-01"), inicio: new Date("2026-11-03"), fim: new Date("2026-11-10") };
    expect(inscricaoAberta(new Date("2026-11-02"), j, true)).toBe(true);
    expect(inscricaoAberta(new Date("2026-11-02"), j, false)).toBe(false);
    expect(inscricaoAberta(new Date("2026-11-04"), j, false)).toBe(true);
    expect(inscricaoAberta(new Date("2026-11-11"), j, true)).toBe(false);
  });
});
