// Edição e exclusão no painel: regras que protegem a liga de ficar inconsistente
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { ClubeController } from "@/controllers/ClubeController";
import { PartidaController } from "@/controllers/PartidaController";
import { TemporadaController } from "@/controllers/TemporadaController";
import { partidasRepo } from "@/models/repositories";
import { semear } from "../scripts/semear";
import { simular } from "../scripts/simulacao";

let db: Db;
let ids: { temporadaId: number; ligaId: number };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const n = async (tabela: any) => (await db.select().from(tabela)).length;

beforeEach(async () => {
  const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(pg, { migrationsFolder: "drizzle" });
  db = pg as unknown as Db;
  ids = await semear(db);
});

describe("competição", () => {
  it("apagar a tabela leva rodadas, partidas, resultados e suspensões, e deixa gerar de novo", async () => {
    const comp = new CompeticaoController(db);
    await comp.gerarTabelaLiga(ids.ligaId);
    await simular(db, 2);
    expect(await comp.resultadosLancados(ids.ligaId)).toBe(16);
    await comp.apagarTabela(ids.ligaId);
    expect([await n(schema.partidas), await n(schema.estatisticas), await n(schema.suspensoes)]).toEqual([0, 0, 0]);
    expect(await comp.gerarTabelaLiga(ids.ligaId)).toEqual({ rodadas: 30, partidas: 240 });
  });
  it("excluir a competição mantém clubes e atletas", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await new CompeticaoController(db).excluir(ids.ligaId);
    expect([await n(schema.competicoes), await n(schema.inscricoes), await n(schema.clubes)]).toEqual([0, 0, 16]);
  });
});

describe("clube e atleta", () => {
  it("clube na tabela não sai; sem tabela sai e leva atletas sem jogo", async () => {
    const comp = new CompeticaoController(db);
    await comp.gerarTabelaLiga(ids.ligaId);
    const clubes = new ClubeController(db);
    await expect(clubes.excluir(1)).rejects.toThrow("Apague a tabela");
    await comp.apagarTabela(ids.ligaId);
    expect(await clubes.excluir(1)).toBe("Moeda FC");
    expect([await n(schema.clubes), await n(schema.atletas)]).toEqual([15, 15 * 8]);
  });
  it("editar atleta barra nome e ID repetidos e salva correção", async () => {
    const clubes = new ClubeController(db);
    const [a] = await db.select().from(schema.atletas).where(eq(schema.atletas.nomePersonagem, "moeda_1"));
    await expect(clubes.editarAtleta(a.id, { nomePersonagem: "MOEDA_2", plataforma: a.plataforma, idPlataforma: a.idPlataforma })).rejects.toThrow("outro atleta");
    await expect(clubes.editarAtleta(a.id, { nomePersonagem: "novo", plataforma: "xbox", idPlataforma: "moeda-fc-2" })).rejects.toThrow("Esse ID");
    await clubes.editarAtleta(a.id, { nomePersonagem: "Moeda10", plataforma: "pc", idPlataforma: "ea-moeda10", twitch: "@x" });
    const [salvo] = await db.select().from(schema.atletas).where(eq(schema.atletas.id, a.id));
    expect([salvo.nomePersonagem, salvo.plataforma, salvo.idPlataforma]).toEqual(["Moeda10", "pc", "ea-moeda10"]);
  });
  it("atleta com jogo registrado não é excluído; sem jogo é", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await simular(db, 1);
    const [comJogo] = await db.select({ id: schema.estatisticas.atletaId }).from(schema.estatisticas).limit(1);
    const clubes = new ClubeController(db);
    await expect(clubes.excluirAtleta(comJogo.id)).rejects.toThrow("Liberar");
    const [novo] = await db.insert(schema.atletas).values({ nomePersonagem: "engano", plataforma: "pc", idPlataforma: "x" }).returning();
    expect(await clubes.excluirAtleta(novo.id)).toBe("engano");
  });
});

describe("temporada e resultado", () => {
  it("temporada só sai vazia; número não repete", async () => {
    const t = new TemporadaController(db);
    await expect(t.excluir(ids.temporadaId)).rejects.toThrow("vazia");
    const nova = await t.criar(2, "Temporada 2");
    await expect(t.editar(nova.id, 1, "X")).rejects.toThrow("número 1");
    await t.editar(nova.id, 3, "Temporada 3");
    await t.excluir(nova.id);
    expect(await n(schema.temporadas)).toBe(1);
  });
  it("desfazer resultado da liga apaga placar, estatísticas e suspensões", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await simular(db, 1);
    const p = (await partidasRepo.daCompeticao(db, ids.ligaId))[0].partida;
    expect(await new PartidaController(db).desfazerResultado(p.id)).toEqual({ ok: true, alertas: [] });
    const depois = (await partidasRepo.buscar(db, p.id))!;
    expect([depois.status, depois.golsMandante]).toEqual(["agendada", null]);
    expect((await db.select().from(schema.estatisticas).where(eq(schema.estatisticas.partidaId, p.id))).length).toBe(0);
    expect((await new PartidaController(db).desfazerResultado(p.id)).ok).toBe(false);
  });
  it("copa: desfazer tira o vencedor da fase seguinte, e trava se ela já foi jogada", async () => {
    const [copa] = await db.insert(schema.competicoes).values({ temporadaId: ids.temporadaId, nome: "Copa", tipo: "copa", status: "em_andamento" }).returning();
    for (const clubeId of [1, 2, 3, 4]) await db.insert(schema.inscricoes).values({ competicaoId: copa.id, clubeId, status: "confirmada" });
    await new CompeticaoController(db).gerarChaveCopa(copa.id);
    const [semi1, semi2] = (await partidasRepo.daCompeticao(db, copa.id)).map((t) => t.partida);
    const ctrl = new PartidaController(db);
    await ctrl.aplicarWO(semi1.id, "mandante_vence");
    const final = (await partidasRepo.dependentes(db, semi1.id))[0];
    expect((await partidasRepo.buscar(db, final.id))!.mandanteId).toBe(semi1.mandanteId);
    await ctrl.aplicarWO(semi2.id, "mandante_vence");
    await ctrl.aplicarWO(final.id, "visitante_vence");
    expect((await ctrl.desfazerResultado(semi1.id)).ok).toBe(false);
    await ctrl.desfazerResultado(final.id);
    await ctrl.desfazerResultado(semi1.id);
    expect((await partidasRepo.buscar(db, final.id))!.mandanteId).toBeNull();
  });
});
