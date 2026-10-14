import { describe, expect, it } from "vitest";
import { conferirSenha, criarToken, gerarHashSenha, lerToken } from "@/lib/seguranca";
import { deInputLocal, paraInputLocal } from "@/lib/datas";
import { validarImagem } from "@/lib/imagem";
import { centavos, reais, slugificar } from "@/lib/texto";
import { lerEstatisticas } from "@/controllers/acoes/formularios";

const SEGREDO = "x".repeat(40);

describe("senha e sessão", () => {
  it("confere a senha certa e recusa a errada", async () => {
    const hash = await gerarHashSenha("senha-forte-123");
    expect(await conferirSenha("senha-forte-123", hash)).toBe(true);
    expect(await conferirSenha("senha-errada", hash)).toBe(false);
  });
  it("token adulterado, de outro segredo ou vencido não vale", () => {
    const token = criarToken({ adminId: 7, expiraEm: Date.now() + 60_000 }, SEGREDO);
    expect(lerToken(token, SEGREDO)?.adminId).toBe(7);
    const [corpo, assinatura] = token.split(".");
    const outroCorpo = Buffer.from(JSON.stringify({ adminId: 1, expiraEm: Date.now() + 60_000 })).toString("base64url");
    expect(lerToken(`${outroCorpo}.${assinatura}`, SEGREDO)).toBeNull();
    expect(lerToken(`${corpo}.${assinatura}`, "y".repeat(40))).toBeNull();
    expect(lerToken(criarToken({ adminId: 7, expiraEm: Date.now() - 1 }, SEGREDO), SEGREDO)).toBeNull();
  });
});

describe("datas no horário de Brasília", () => {
  it("21h30 digitado no painel vira 00h30 UTC e volta igual", () => {
    const d = deInputLocal("2026-10-14T21:30")!;
    expect(d.toISOString()).toBe("2026-10-15T00:30:00.000Z");
    expect(paraInputLocal(d)).toBe("2026-10-14T21:30");
    expect(deInputLocal("")).toBeNull();
  });
});

describe("imagens", () => {
  it("aceita PNG de verdade e recusa texto com extensão de imagem", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(validarImagem(png)).toEqual({ tipo: "image/png" });
    expect(validarImagem(new TextEncoder().encode("<html>oi</html>"))).toHaveProperty("erro");
    expect(validarImagem(new Uint8Array(3 * 1024 * 1024 + 1))).toEqual({ erro: "Imagem maior que 3 MB." });
  });
});

describe("textos", () => {
  it("slug, valores em reais", () => {
    expect(slugificar("Bônus AC")).toBe("bonus-ac");
    expect(centavos("R$ 25,50")).toBe(2550);
    expect(centavos("")).toBeNull();
    expect(reais(2550).replace(/\s/g, " ")).toBe("R$ 25,50");
  });
});

describe("grade de estatísticas da tela de resultado", () => {
  it("quem tem número preenchido conta como jogou; MVP e goleiro saem dos rádios", () => {
    const f = new FormData();
    for (const a of ["1:10", "2:10", "3:10", "4:20"]) f.append("atleta", a);
    f.set("gols_1", "2"); f.set("pen_1", "1");
    f.set("jogou_2", "on");
    f.set("goleiro_10", "2"); f.set("mvp", "1"); f.set("verm_4", "on");
    const linhas = lerEstatisticas(f);
    expect(linhas.map((l) => l.atletaId)).toEqual([1, 2, 4]);
    expect(linhas[0]).toMatchObject({ gols: 2, golsPenalti: 1, mvp: true });
    expect(linhas[1]).toMatchObject({ goleiro: true, gols: 0 });
    expect(linhas[2]).toMatchObject({ clubeId: 20, cartaoVermelho: true });
  });
});

import { falha } from "@/controllers/acoes/estado";

describe("mensagens de erro das ações", () => {
  const erroDoBanco = (code: string, message: string) =>
    Object.assign(new Error("Failed query: insert into arquivos ... params: <imagem inteira>"), { cause: { code, message } });
  it("tabela faltando manda rodar a migração; dados da consulta nunca aparecem", () => {
    const silencio = console.error; console.error = () => {};
    expect(falha(erroDoBanco("42P01", 'relation "arquivos" does not exist'))?.erros?.[0]).toContain("npm run db:migrate");
    const outro = falha(erroDoBanco("23505", "duplicate key"))?.erros?.[0] ?? "";
    expect(outro).toContain("duplicate key");
    expect(outro).not.toContain("params");
    console.error = silencio;
  });
  it("erro de regra aparece como está", () => {
    expect(falha(new Error("Já existe um clube com esse nome"))).toEqual({ erros: ["Já existe um clube com esse nome"] });
  });
});

import { resumir } from "@/lib/texto";

describe("resumo da capa do jornal", () => {
  it("junta parágrafos inteiros até o limite e corta o primeiro se ele sozinho passar", () => {
    const p1 = "Mercado de periféricos é agitado após administrador anunciar aquisição de nova interface de áudio.";
    const p2 = "Em uma movimentação que promete entrar para a história da liga, o administrador surpreendeu a comunidade.";
    const texto = `${p1}\n\n${p2}\n\nTerceiro parágrafo bem mais longo que não cabe mais no resumo da capa do jornal.`;
    expect(resumir(texto, 220)).toEqual({ paragrafos: [p1, p2], cortado: true });
    expect(resumir(texto, 120)).toEqual({ paragrafos: [p1], cortado: true });
    const r = resumir(texto, 40);
    expect(r.paragrafos).toHaveLength(1);
    expect(r.paragrafos[0].endsWith("…")).toBe(true);
    expect(r.paragrafos[0]).not.toMatch(/\s…$/); // não termina com espaço antes das reticências
    expect(resumir("Curto.", 100)).toEqual({ paragrafos: ["Curto."], cortado: false });
  });
});
