// Controllers do admin num Postgres em memória
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { ClubeController } from "@/controllers/ClubeController";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { AuthController } from "@/controllers/AuthController";
import { PartidaController } from "@/controllers/PartidaController";
import { ArquivoController } from "@/controllers/ArquivoController";

let db: Db;
beforeEach(async () => {
  const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(pg, { migrationsFolder: "drizzle" });
  db = pg as unknown as Db;
});

async function montarLiga(clubes: number) {
  const t = await new TemporadaController(db).criar(1, "Temporada 1");
  const comp = new CompeticaoController(db);
  const liga = await comp.criar(t.id, "liga", "Liga teste");
  const ctrl = new ClubeController(db);
  for (let i = 1; i <= clubes; i++) {
    const c = await ctrl.criar(`Clube ${i}`, null);
    await comp.inscreverClube(liga.id, c.id);
  }
  return { t, liga };
}

describe("temporada, clubes e elenco", () => {
  it("primeira temporada já nasce ativa", async () => {
    const t = await new TemporadaController(db).criar(1, "Temporada 1");
    expect((await new TemporadaController(db).ativa())?.id).toBe(t.id);
  });

  it("antes de começar o elenco é livre; nome de personagem repetido com outro ID é recusado", async () => {
    const { t } = await montarLiga(2);
    const ctrl = new ClubeController(db);
    const ok = await ctrl.adicionarAtleta(t.id, 1, { nomePersonagem: "Craque10", plataforma: "ps5", idPlataforma: "psn-craque" });
    expect(ok).toEqual({ ok: true });
    const outroClube = await ctrl.adicionarAtleta(t.id, 2, { nomePersonagem: "craque10", plataforma: "ps5", idPlataforma: "psn-craque" });
    expect(outroClube.ok).toBe(false); // já está no clube 1
    const outroId = await ctrl.adicionarAtleta(t.id, 2, { nomePersonagem: "Craque10", plataforma: "pc", idPlataforma: "ea-outro" });
    expect(outroId.ok).toBe(false);
  });

  it("no máximo 2 capitães e clube com nome repetido é recusado", async () => {
    const { t } = await montarLiga(1);
    const ctrl = new ClubeController(db);
    for (let i = 1; i <= 3; i++)
      await ctrl.adicionarAtleta(t.id, 1, { nomePersonagem: `Atleta${i}`, plataforma: "xbox", idPlataforma: `gt-${i}` });
    const elenco = (await ctrl.detalhe(1, t.id))!.elenco;
    await ctrl.definirCapitao(elenco[0].vinculo.id, true);
    await ctrl.definirCapitao(elenco[1].vinculo.id, true);
    await expect(ctrl.definirCapitao(elenco[2].vinculo.id, true)).rejects.toThrow("2 capitães");
    await expect(ctrl.criar("clube 1", null)).rejects.toThrow("Já existe");
  });
});

describe("inscrições e geração", () => {
  it("vaga cheia vai para espera; taxa exige pagamento; gerar trava inscrições", async () => {
    const { liga } = await montarLiga(3);
    const comp = new CompeticaoController(db);
    await comp.atualizarFicha(liga.id, {
      nome: "Liga teste", status: "inscricoes", ativa: true, maxClubes: 2, dataInicio: null, dataFim: null,
      inscricaoSubInicio: null, inscricaoInicio: null, inscricaoFim: null, taxaCentavos: 1000, premio: null,
    });
    const ins = await comp.inscricoes(liga.id);
    await expect(comp.confirmarInscricao(ins[0].inscricao.id)).rejects.toThrow("pagamento");
    for (const i of ins) await comp.alterarInscricao(i.inscricao.id, { pago: true });
    expect(await comp.confirmarInscricao(ins[0].inscricao.id)).toBe("confirmada");
    expect(await comp.confirmarInscricao(ins[1].inscricao.id)).toBe("confirmada");
    expect(await comp.confirmarInscricao(ins[2].inscricao.id)).toBe("espera");
    await comp.gerar(liga.id, false);
    const rodadas = await new PartidaController(db).rodada(liga.id);
    expect(rodadas?.rodadas).toHaveLength(2);
    await expect(comp.removerInscricao(liga.id, ins[2].inscricao.id)).rejects.toThrow("já foi gerada");
  });
});

describe("login e arquivos", () => {
  it("cria admin, entra com a senha certa e recusa a errada", async () => {
    const auth = new AuthController(db);
    await expect(auth.criar({ nome: "A", email: "a@a.com", senha: "curta" })).rejects.toThrow("10 caracteres");
    await auth.criar({ nome: "Antônio", email: "Dono@CPL.com", senha: "senha-muito-forte" });
    expect((await auth.login("dono@cpl.com", "senha-muito-forte"))?.nome).toBe("Antônio");
    expect(await auth.login("dono@cpl.com", "errada")).toBeNull();
    expect(await auth.login("ninguem@cpl.com", "senha-muito-forte")).toBeNull();
  });

  it("salva imagem válida e recusa arquivo disfarçado", async () => {
    const arq = new ArquivoController(db);
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])], "escudo.png");
    const r = await arq.salvarImagem(png);
    expect(r && "url" in r && r.url.startsWith("/arquivos/")).toBe(true);
    const id = (r as { url: string }).url.split("/").pop()!;
    expect((await arq.buscar(id))?.mime).toBe("image/png");
    expect(await arq.salvarImagem(new File(["<script>"], "x.png"))).toHaveProperty("erro");
    expect(await arq.salvarImagem(null)).toBeNull();
  });
});
