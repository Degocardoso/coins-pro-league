// Botão "liga na live", senha do OBS e duração da sessão
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { LigaNaLiveController } from "@/controllers/LigaNaLiveController";
import { ObsController } from "@/controllers/ObsController";
import { criarToken, lerToken, senhaIgual } from "@/lib/seguranca";
import { semear } from "../scripts/semear";
import { simular } from "../scripts/simulacao";

const OITO_HORAS = 8 * 60 * 60 * 1000;

describe("sessão de 8 horas", () => {
  const segredo = "x".repeat(40);
  it("aceita sessão de até 8 h e recusa a de 7 dias criada pela regra antiga", () => {
    const agora = Date.now();
    const nova = criarToken({ adminId: 1, expiraEm: agora + OITO_HORAS }, segredo);
    const antiga = criarToken({ adminId: 1, expiraEm: agora + 7 * 24 * 3600 * 1000 }, segredo);
    expect(lerToken(nova, segredo, agora, OITO_HORAS)?.adminId).toBe(1);
    expect(lerToken(antiga, segredo, agora, OITO_HORAS)).toBeNull();
    expect(lerToken(nova, segredo, agora + OITO_HORAS + 1, OITO_HORAS)).toBeNull(); // passou das 8 h
  });
  it("token assinado com outra chave (ex.: o do login no lugar do OBS) não vale", () => {
    const t = criarToken({ adminId: 1, expiraEm: Date.now() + 60_000 }, segredo);
    expect(lerToken(t, `${segredo}:area-do-obs`)).toBeNull();
  });
  it("compara a senha do OBS", () => {
    expect(senhaIgual("senha-do-obs", "senha-do-obs")).toBe(true);
    expect(senhaIgual("senha-do-ob", "senha-do-obs")).toBe(false);
  });
});

describe("liga na live", () => {
  let db: Db;
  let ligaId: number;
  beforeEach(async () => {
    const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
    await migrate(pg, { migrationsFolder: "drizzle" });
    db = pg as unknown as Db;
    ligaId = (await semear(db)).ligaId;
    await new CompeticaoController(db).gerarTabelaLiga(ligaId);
    await simular(db, 2);
  });

  it("ligada por padrão; desligada, os dados das cenas vêm sem nada da liga", async () => {
    const live = new LigaNaLiveController(db);
    expect(await live.ligada()).toBe(true);
    expect((await new ObsController(db).dados(ligaId)).resultados).not.toBeNull();
    const [admin] = await db.insert(schema.admins).values({ nome: "Antônio", email: "a@b.c", senhaHash: "x" }).returning();
    await live.definir(false, admin.id);
    const d = await new ObsController(db).dados(ligaId);
    expect(d).toMatchObject({ ligaNaLive: false, competicao: null, resultados: null, proximos: null, inscricao: null, campeao: null });
    expect([d.classificacao.length, d.artilharia.length]).toEqual([0, 0]);
    expect(await live.estado()).toMatchObject({ ligada: false, por: "Antônio" });
    await live.definir(true, admin.id);
    expect((await new ObsController(db).dados(ligaId)).ligaNaLive).toBe(true);
  });

  it("sem a tabela de configurações (migração não rodada), nada quebra e a liga fica ligada", async () => {
    await db.execute(sql`drop table configuracoes`);
    expect(await new LigaNaLiveController(db).ligada()).toBe(true);
    expect((await new ObsController(db).dados(ligaId)).ligaNaLive).toBe(true);
  });
});
