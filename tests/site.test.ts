import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { situacaoInscricao } from "@/controllers/regras/elenco";
import { lerMarkdown } from "@/views/comum/Markdown";
import { InscricaoController, type DadosInscricao } from "@/controllers/InscricaoController";
import { SiteController } from "@/controllers/SiteController";
import { REGULAMENTO_OFICIAL } from "@/models/conteudo/regulamento";
import { semear } from "../scripts/semear";
import { simular } from "../scripts/simulacao";

const dia = (n: number) => new Date(Date.UTC(2026, 10, n, 12));

describe("situação da inscrição", () => {
  const c = { status: "inscricoes", inscricaoSubInicio: dia(1), inscricaoInicio: dia(3), inscricaoFim: dia(10) };
  it("fechada antes, só subs no começo, aberta para todos, fechada depois", () => {
    expect(situacaoInscricao(dia(0), c).aberta).toBe(false);
    expect(situacaoInscricao(dia(2), c)).toMatchObject({ aberta: true, soSubs: true });
    expect(situacaoInscricao(dia(5), c)).toMatchObject({ aberta: true, soSubs: false });
    expect(situacaoInscricao(dia(11), c).aberta).toBe(false);
  });
  it("só abre com a competição em inscrições; sem datas, fica aberta", () => {
    expect(situacaoInscricao(dia(5), { ...c, status: "em_andamento" }).aberta).toBe(false);
    expect(situacaoInscricao(dia(5), { status: "inscricoes", inscricaoSubInicio: null, inscricaoInicio: null, inscricaoFim: null }).aberta).toBe(true);
  });
});

describe("markdown do regulamento", () => {
  it("lê as 15 seções e as listas numeradas, sem virar HTML", () => {
    const blocos = lerMarkdown(REGULAMENTO_OFICIAL);
    expect(blocos.filter((b) => b.tipo === "titulo")).toHaveLength(15);
    expect(blocos.find((b) => b.tipo === "lista")).toMatchObject({ ordenada: true });
    const perigoso = lerMarkdown("<script>alert(1)</script>");
    expect(perigoso).toEqual([{ tipo: "paragrafo", texto: "<script>alert(1)</script>" }]); // vira texto, não código
  });
});

describe("inscrição pública e abas do site", () => {
  let db: Db;
  let ids: { temporadaId: number; ligaId: number };
  const escudo = { nome: "e.png", mime: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]) };
  const atletas = (prefixo: string, n = 7) =>
    Array.from({ length: n }, (_, i) => ({ nomePersonagem: `${prefixo}${i}`, plataforma: "pc" as const, idPlataforma: `${prefixo}-id-${i}`, capitao: i < 2 }));

  beforeEach(async () => {
    const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
    await migrate(pg, { migrationsFolder: "drizzle" });
    db = pg as unknown as Db;
    ids = await semear(db);
  });

  async function copaAberta(extra: Partial<typeof schema.competicoes.$inferInsert> = {}) {
    const [copa] = await db
      .insert(schema.competicoes)
      .values({ temporadaId: ids.temporadaId, nome: "Copa", tipo: "copa", status: "inscricoes", ...extra })
      .returning();
    return copa;
  }
  const dados = (competicaoId: number, extra: Partial<DadosInscricao> = {}): DadosInscricao => ({
    competicaoId, nomeClube: "Raio FC", escudo, capitaoSub: false, twitchCapitao: null, discordCapitao: "capitao.raio", atletas: atletas("raio"), ...extra,
  });

  it("clube novo entra na copa com a liga em andamento (elenco inicial não é transferência)", async () => {
    const copa = await copaAberta();
    expect(await new InscricaoController(db).inscrever(dados(copa.id))).toEqual({ ok: true, clube: "Raio FC" });
    const [clube] = await db.select().from(schema.clubes).where(eq(schema.clubes.nome, "Raio FC"));
    const elenco = await db.select().from(schema.vinculos).where(eq(schema.vinculos.clubeId, clube.id));
    expect([elenco.length, elenco.filter((v) => v.capitao).length]).toEqual([7, 2]);
    expect(clube.escudoUrl).toMatch(/^\/arquivos\//);
  });

  it("atleta de outro clube desfaz tudo: nem clube nem escudo ficam gravados", async () => {
    const copa = await copaAberta();
    const lista = [...atletas("raio", 6), { nomePersonagem: "moeda_1", plataforma: "ps5" as const, idPlataforma: "moeda-fc-1", capitao: false }];
    const r = await new InscricaoController(db).inscrever(dados(copa.id, { atletas: lista }));
    expect(r.ok).toBe(false);
    expect(await db.select().from(schema.clubes).where(eq(schema.clubes.nome, "Raio FC"))).toHaveLength(0);
    expect(await db.select().from(schema.arquivos)).toHaveLength(0);
  });

  it("período só de subs exige capitão sub com Twitch", async () => {
    const copa = await copaAberta({ inscricaoSubInicio: new Date(Date.now() - 86_400_000), inscricaoInicio: new Date(Date.now() + 86_400_000) });
    const ctrl = new InscricaoController(db);
    expect((await ctrl.inscrever(dados(copa.id))).ok).toBe(false);
    expect((await ctrl.inscrever(dados(copa.id, { capitaoSub: true }))).ok).toBe(false); // falta a Twitch
    expect(await ctrl.inscrever(dados(copa.id, { capitaoSub: true, twitchCapitao: "capitao_sub" }))).toMatchObject({ ok: true });
    // Discord do capitão: obrigatório e guardado limpo (sem o @)
    expect((await ctrl.inscrever(dados(copa.id, { nomeClube: "Sem Discord FC", discordCapitao: "" }))).ok).toBe(false);
    const comArroba = await ctrl.inscrever(
      dados(copa.id, { nomeClube: "Com Arroba FC", discordCapitao: "@capitao.arroba", capitaoSub: true, twitchCapitao: "arroba", atletas: atletas("arroba") }),
    );
    expect(comArroba).toMatchObject({ ok: true });
    const guardado = (await db.select().from(schema.inscricoes)).map((i) => i.discordCapitao);
    expect(guardado).toContain("capitao.arroba");
  });

  it("competição fechada recusa", async () => {
    expect((await new InscricaoController(db).inscrever(dados(ids.ligaId))).ok).toBe(false);
  });

  it("abas do site com a liga rodando", async () => {
    const { CompeticaoController } = await import("@/controllers/CompeticaoController");
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await simular(db, 3);
    const site = new SiteController(db);
    const liga = await site.aLiga();
    expect(liga.clubes).toHaveLength(16);
    expect(liga.clubes[0].elenco).toHaveLength(8);
    expect(liga.destaque?.tipo).toBe("proximo");
    const tabela = await site.tabela(null);
    expect(tabela.tipo).toBe("liga");
    if (tabela.tipo === "liga") {
      expect(tabela.classificacao.reduce((s, l) => s + l.jogos, 0)).toBe(48); // 3 rodadas x 8 jogos x 2 clubes
      expect(tabela.rodada?.atual.numero).toBe(4);
    }
    expect((await site.regulamento()).regulamento.conteudo).toContain("## 1. Disposições gerais");
  });
});

describe("jornal da liga", () => {
  it("rascunho não aparece, capa pagina de 13 em 13 e a notícia mostra outras 3", async () => {
    const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
    await migrate(pg, { migrationsFolder: "drizzle" });
    const db = pg as unknown as Db;
    const { JornalController } = await import("@/controllers/JornalController");
    for (let i = 1; i <= 15; i++)
      await db.insert(schema.noticias).values({ titulo: `Notícia ${i}`, texto: "Texto", publicada: i !== 15, publicadaEm: new Date(Date.UTC(2026, 9, i)) });
    const j = new JornalController(db);
    const capa = await j.capa(1);
    expect(capa.manchete?.titulo).toBe("Notícia 14"); // a 15 é rascunho
    expect([capa.demais.length, capa.paginas]).toEqual([12, 2]);
    expect((await j.capa(2)).manchete?.titulo).toBe("Notícia 1");
    expect((await j.capa(99)).pagina).toBe(2);
    const rascunho = (await db.select().from(schema.noticias).where(eq(schema.noticias.titulo, "Notícia 15")))[0];
    expect(await j.noticia(rascunho.id)).toBeNull();
    const n = await j.noticia(capa.manchete!.id);
    expect(n?.mais.map((m) => m.titulo)).toEqual(["Notícia 13", "Notícia 12", "Notícia 11"]);
  });
});
