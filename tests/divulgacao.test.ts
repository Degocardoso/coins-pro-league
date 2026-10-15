// Divulgação: a arte e os textos saem da ficha da competição
import { describe, expect, it } from "vitest";
import { montarConteudo, montarTextos, tamanhoNoX, type FichaDivulgacao } from "@/controllers/regras/divulgacao";

const agora = new Date("2026-10-15T15:00:00-03:00");
const base: FichaDivulgacao = {
  id: 2, nome: "Copa Moeda", tipo: "copa", status: "inscricoes", maxClubes: 8, taxaCentavos: null, premio: null,
  inscricaoSubInicio: null, inscricaoInicio: null, inscricaoFim: null, temporada: "Temporada 1",
};
const ORIGEM = "https://coins-pro-league.vercel.app";

describe("conteúdo da arte", () => {
  it("aberta, gratuita e sem prêmio: sem linha de prêmio", () => {
    const a = montarConteudo(base, ORIGEM, agora);
    expect(a.titulo).toEqual(["Inscrições", "abertas"]);
    expect(a.fatos).toEqual(["Mata-mata, 8 clubes", "Crossplay PS5, Xbox e PC", "Inscrição gratuita"]);
    expect(a.cta).toEqual({ rotulo: "Inscreva seu clube", link: "coins-pro-league.vercel.app/i/2" });
    expect(a.mostrarNome).toBe(true);
  });

  it("paga, com prêmio e prazo: tudo vem da ficha", () => {
    const a = montarConteudo({ ...base, taxaCentavos: 3000, premio: "R$ 300 + banner na live", inscricaoFim: new Date("2026-10-22T23:59:00-03:00") }, ORIGEM, agora);
    expect(a.fatos).toContain("Inscrição: R$ 30,00 por clube");
    expect(a.fatos).toContain("Premiação: R$ 300 + banner na live");
    expect(a.fatos.some((f) => f.startsWith("Inscrições até"))).toBe(true);
  });

  it("a liga com o mesmo nome do logo não repete o nome; em andamento manda para a tabela e tira a taxa", () => {
    const a = montarConteudo({ ...base, id: 1, nome: "Coin's Pro League", tipo: "liga", maxClubes: 16, status: "em_andamento", taxaCentavos: 2000 }, ORIGEM, agora);
    expect(a.mostrarNome).toBe(false);
    expect(a.titulo).toEqual(["Acompanhe", "a liga"]);
    expect(a.fatos).toEqual(["16 clubes, ida e volta", "Crossplay PS5, Xbox e PC"]);
    expect(a.cta.link).toBe("coins-pro-league.vercel.app/tabela?c=1");
  });

  it("antes de abrir: em breve, com a data de abertura", () => {
    const a = montarConteudo({ ...base, status: "rascunho", inscricaoInicio: new Date("2026-10-25T10:00:00-03:00") }, ORIGEM, agora);
    expect(a.titulo).toEqual(["Inscrições", "em breve"]);
    expect(a.fatos.some((f) => f.startsWith("Inscrições a partir de"))).toBe(true);
    expect(a.cta.rotulo).toBe("Fique de olho");
  });

  it("prêmio muito longo é cortado na arte", () => {
    const a = montarConteudo({ ...base, premio: "R$ 1.000 para o campeão, R$ 300 para o vice e banner na live para os dois" }, ORIGEM, agora);
    const premio = a.fatos.find((f) => f.startsWith("Premiação"))!;
    expect(premio.length).toBeLessThanOrEqual("Premiação: ".length + 48);
    expect(premio.endsWith("…")).toBe(true);
  });
});

describe("textos dos posts", () => {
  it("WhatsApp e Instagram levam taxa, prêmio e o link curto", () => {
    const t = montarTextos(montarConteudo({ ...base, taxaCentavos: 3000, premio: "R$ 300" }, ORIGEM, agora));
    for (const texto of [t.whatsapp, t.instagram]) {
      expect(texto).toContain("R$ 30,00 por clube");
      expect(texto).toContain("Premiação: R$ 300");
      expect(texto).toContain("coins-pro-league.vercel.app/i/2");
    }
    expect(t.whatsapp).toContain("*COPA MOEDA*");
  });

  it("X sempre cabe em 280, mesmo com nome e prêmio no tamanho máximo", () => {
    const longo = { ...base, nome: "Copa ".padEnd(80, "x"), taxaCentavos: 12345, premio: "p".repeat(200), inscricaoFim: new Date("2026-10-22T23:59:00-03:00") };
    for (const ficha of [base, { ...base, taxaCentavos: 3000, premio: "R$ 300 + banner" }, longo, { ...longo, status: "em_andamento" }, { ...longo, status: "rascunho" }]) {
      const x = montarTextos(montarConteudo(ficha, ORIGEM, agora)).x;
      expect(tamanhoNoX(x), x).toBeLessThanOrEqual(280);
      expect(x).toContain("coins-pro-league.vercel.app");
    }
  });

  it("no X, link conta 23 e emoji conta 2", () => {
    expect(tamanhoNoX("abc coins-pro-league.vercel.app/inscricao")).toBe(4 + 23);
    expect(tamanhoNoX("🏆")).toBe(2);
  });
});
