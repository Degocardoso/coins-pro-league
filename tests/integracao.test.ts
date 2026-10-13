// Integração: migração real + controllers num Postgres em memória (PGlite)
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { and, eq } from "drizzle-orm";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { PartidaController } from "@/controllers/PartidaController";
import { ClassificacaoController } from "@/controllers/ClassificacaoController";
import { ElencoController } from "@/controllers/ElencoController";
import { partidasRepo } from "@/models/repositories";
import { semear } from "../scripts/semear";

let db: Db;
let ids: { temporadaId: number; ligaId: number };

beforeEach(async () => {
  const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(pg, { migrationsFolder: "drizzle" });
  db = pg as unknown as Db;
  ids = await semear(db);
});

async function elencoDe(clubeId: number) {
  const v = await db
    .select()
    .from(schema.vinculos)
    .where(and(eq(schema.vinculos.clubeId, clubeId), eq(schema.vinculos.temporadaId, ids.temporadaId)));
  return v.map((x) => x.atletaId);
}

const linha = (atletaId: number, clubeId: number, extra: Record<string, unknown> = {}) => ({
  atletaId, clubeId, gols: 0, golsPenalti: 0, assistencias: 0, mvp: false, goleiro: false, cartaoVermelho: false, ...extra,
});

describe("liga de ponta a ponta", () => {
  it("gera 30 rodadas e 240 partidas, e não gera duas vezes", async () => {
    const comp = new CompeticaoController(db);
    expect(await comp.gerarTabelaLiga(ids.ligaId)).toEqual({ rodadas: 30, partidas: 240 });
    await expect(comp.gerarTabelaLiga(ids.ligaId)).rejects.toThrow("já foi gerada");
  });

  it("resultado atualiza classificação, rankings e suspensão por vermelho", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    const partidas = await partidasRepo.daCompeticao(db, ids.ligaId);
    const p1 = partidas[0].partida;
    const [m, v] = [p1.mandanteId!, p1.visitanteId!];
    const em = await elencoDe(m);
    const ev = await elencoDe(v);

    const ctrl = new PartidaController(db);
    const r = await ctrl.lancarResultado(p1.id, {
      golsMandante: 2,
      golsVisitante: 0,
      estatisticas: [
        linha(em[0], m, { gols: 2, golsPenalti: 1, mvp: true }),
        linha(em[1], m, { assistencias: 1, goleiro: false }),
        linha(em[2], m, { goleiro: true }),
        linha(em[3], m),
        linha(em[4], m),
        ...ev.slice(0, 4).map((a) => linha(a, v)),
        linha(ev[4], v, { cartaoVermelho: true }),
      ],
    });
    expect(r).toEqual({ ok: true, alertas: [] });

    const cls = new ClassificacaoController(db);
    const tabela = await cls.classificacao(ids.ligaId);
    expect(tabela[0]).toMatchObject({ clubeId: m, pontos: 3, saldo: 2 });

    const rk = await cls.rankings(ids.ligaId);
    expect(rk.artilharia[0]).toMatchObject({ atletaId: em[0], valor: 2 });
    expect(rk.penaltis[0]).toMatchObject({ atletaId: em[0], valor: 1 });
    expect(rk.semSofrerGol.map((i) => i.atletaId)).toEqual([em[2]]);

    // O expulso fica suspenso na próxima partida do visitante e vira alerta se jogar
    const proxima = await partidasRepo.proximaDoClube(db, p1, v);
    const pp = (await partidasRepo.buscar(db, proxima!))!;
    const outro = pp.mandanteId === v ? pp.visitanteId! : pp.mandanteId!;
    const eo = await elencoDe(outro);
    const r2 = await ctrl.lancarResultado(pp.id, {
      golsMandante: 1,
      golsVisitante: 1,
      estatisticas: [...ev.map((a) => linha(a, v)), ...eo.slice(0, 5).map((a) => linha(a, outro))],
    });
    expect(r2.ok && r2.alertas.some((a) => a.includes("estava suspenso"))).toBe(true);
  });

  it("W.O. vale 3x0 na tabela e apaga estatísticas", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    const p = (await partidasRepo.daCompeticao(db, ids.ligaId))[3].partida;
    expect(await new PartidaController(db).aplicarWO(p.id, "visitante_vence")).toEqual({ ok: true, alertas: [] });
    const tabela = await new ClassificacaoController(db).classificacao(ids.ligaId);
    expect(tabela.find((l) => l.clubeId === p.visitanteId)).toMatchObject({ pontos: 3, golsPro: 3 });
    expect(tabela.find((l) => l.clubeId === p.mandanteId)).toMatchObject({ pontos: 0, golsContra: 3 });
  });

  it("resultado com erro não salva nada", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    const p = (await partidasRepo.daCompeticao(db, ids.ligaId))[0].partida;
    const em = await elencoDe(p.mandanteId!);
    const r = await new PartidaController(db).lancarResultado(p.id, {
      golsMandante: 1, golsVisitante: 0, penaltisMandante: 3, penaltisVisitante: 2,
      estatisticas: [linha(em[0], p.mandanteId!, { gols: 4 })],
    });
    expect(r.ok).toBe(false);
    expect((await partidasRepo.buscar(db, p.id))!.status).toBe("a_agendar");
  });
});

describe("elenco e janela", () => {
  it("bloqueia fora da janela e libera dentro dela", async () => {
    const clubeId = (await db.select().from(schema.clubes))[0].id;
    const [novo] = await db
      .insert(schema.atletas)
      .values({ nomePersonagem: "reforco_1", plataforma: "pc", idPlataforma: "reforco-1" })
      .returning();
    const ctrl = new ElencoController(db);
    const fora = await ctrl.adicionar(ids.temporadaId, clubeId, novo.id);
    expect(fora.ok).toBe(false);
    const dentro = await ctrl.adicionar(ids.temporadaId, clubeId, novo.id, { agora: new Date(Date.now() + 62 * 86_400_000) });
    expect(dentro).toEqual({ ok: true });
    const outroClube = (await db.select().from(schema.clubes))[1].id;
    const duplicado = await ctrl.adicionar(ids.temporadaId, outroClube, novo.id, { antesDoInicio: true });
    expect(duplicado.ok).toBe(false);
  });
});

describe("copa de ponta a ponta", () => {
  it("6 clubes: pênaltis definem quem avança para a semifinal", async () => {
    const [copa] = await db
      .insert(schema.competicoes)
      .values({ temporadaId: ids.temporadaId, nome: "Copa Moeda", tipo: "copa", status: "em_andamento", maxClubes: 8 })
      .returning();
    const clubes = (await db.select().from(schema.clubes)).slice(0, 6).map((c) => c.id);
    for (const clubeId of clubes)
      await db.insert(schema.inscricoes).values({ competicaoId: copa.id, clubeId, status: "confirmada" });

    const r = await new CompeticaoController(db).gerarChaveCopa(copa.id);
    expect(r.fases).toEqual([
      { nome: "Quartas de final", partidas: 2 },
      { nome: "Semifinal", partidas: 2 },
      { nome: "Final", partidas: 1 },
    ]);

    const todas = await partidasRepo.daCompeticao(db, copa.id);
    const quartas = todas[0].partida;
    const [m, v] = [quartas.mandanteId!, quartas.visitanteId!];
    const em = await elencoDe(m);
    const ev = await elencoDe(v);
    const ctrl = new PartidaController(db);
    const res = await ctrl.lancarResultado(quartas.id, {
      golsMandante: 1, golsVisitante: 1, prorrogacao: true, penaltisMandante: 3, penaltisVisitante: 4,
      estatisticas: [...em.slice(0, 5).map((a) => linha(a, m)), ...ev.slice(0, 5).map((a) => linha(a, v))],
    });
    expect(res).toEqual({ ok: true, alertas: [] });

    const semi = (await partidasRepo.dependentes(db, quartas.id))[0];
    expect([semi.mandanteId, semi.visitanteId]).toContain(v);

    // Jogada a semifinal, não dá para trocar o vencedor das quartas
    await ctrl.aplicarWO(semi.id, "mandante_vence");
    const troca = await ctrl.lancarResultado(quartas.id, {
      golsMandante: 2, golsVisitante: 1, prorrogacao: true,
      estatisticas: [...em.slice(0, 5).map((a) => linha(a, m)), ...ev.slice(0, 5).map((a) => linha(a, v))],
    });
    expect(troca.ok).toBe(false);
  });
});
