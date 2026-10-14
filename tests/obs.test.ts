// Dados das telas do OBS
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { eq } from "drizzle-orm";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { CompeticaoController } from "@/controllers/CompeticaoController";
import { ObsController } from "@/controllers/ObsController";
import { semear } from "../scripts/semear";
import { simular } from "../scripts/simulacao";

let db: Db;
let ids: { temporadaId: number; ligaId: number };
beforeEach(async () => {
  const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(pg, { migrationsFolder: "drizzle" });
  db = pg as unknown as Db;
  ids = await semear(db);
});

describe("dados do OBS", () => {
  it("sem tabela: nada de jogos, mas a competição aparece", async () => {
    const d = await new ObsController(db).dados(null);
    expect(d.competicao?.nome).toBe("Coin's Pro League");
    expect([d.resultados, d.proximos, d.classificacao.length]).toEqual([null, null, 0]);
  });

  it("liga rodando: última rodada com resultado, próximos em ordem, top 6 e artilharia", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await simular(db, 3);
    const d = await new ObsController(db).dados(ids.ligaId);
    expect(d.resultados?.titulo).toBe("Resultados: Rodada 3");
    expect(d.resultados?.jogos).toHaveLength(8);
    expect(d.proximos?.titulo).toBe("Próximos jogos");
    expect(d.proximos!.jogos.every((j) => j.quando && j.gm === null)).toBe(true);
    expect(d.classificacao).toHaveLength(6);
    expect(d.classificacao[0].pos).toBe(1);
    expect(d.artilharia.length).toBeGreaterThan(0);
    // Só dados públicos: nada de ID de plataforma nem Twitch
    expect(JSON.stringify(d)).not.toMatch(/idPlataforma|twitch|-fc-\d/);
  });

  it("competição encerrada mostra o campeão com o banner", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await simular(db, 2);
    await db.update(schema.competicoes).set({ status: "encerrada", bannerUrl: "/arquivos/x" }).where(eq(schema.competicoes.id, ids.ligaId));
    const d = await new ObsController(db).dados(ids.ligaId);
    expect(d.campeao).toMatchObject({ competicao: "Coin's Pro League", banner: "/arquivos/x" });
    expect(d.campeao?.nome).toBe(d.classificacao[0].nome);
  });
});
