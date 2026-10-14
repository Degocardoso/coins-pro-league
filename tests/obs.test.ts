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
    expect(d.resultados?.titulo).toBe("Últimos resultados");
    expect(d.resultados?.jogos).toHaveLength(8);
    expect(d.proximos?.titulo).toBe("Próximos jogos");
    expect(d.proximos!.jogos.every((j) => j.quando && j.gm === null)).toBe(true);
    expect(d.classificacao).toHaveLength(6);
    expect(d.classificacao[0].pos).toBe(1);
    expect(d.artilharia.length).toBeGreaterThan(0);
    // Só dados públicos: nada de ID de plataforma nem Twitch
    expect(JSON.stringify(d)).not.toMatch(/idPlataforma|twitch|-fc-\d/);
  });

  it("último resultado é o lançado por último, de qualquer rodada, com o selo de novo", async () => {
    await new CompeticaoController(db).gerarTabelaLiga(ids.ligaId);
    await simular(db, 3);
    const { PartidaController } = await import("@/controllers/PartidaController");
    const { partidasRepo } = await import("@/models/repositories");
    const daRodada1 = (await partidasRepo.daCompeticao(db, ids.ligaId))[0].partida; // jogo antigo, da rodada 1
    await db.update(schema.partidas).set({ atualizadoEm: new Date(Date.now() - 3_600_000) }); // todo o resto ficou "velho"
    await new PartidaController(db).aplicarWO(daRodada1.id, "visitante_vence"); // corrigido agora
    const d = await new ObsController(db).dados(ids.ligaId);
    expect(d.resultados!.jogos[0]).toMatchObject({ id: daRodada1.id, rodada: "Rodada 1", gm: 0, gv: 3, novo: true });
    expect(d.resultados!.jogos.slice(1).every((j) => !j.novo)).toBe(true);
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

describe("QR code da inscrição", () => {
  it("gera SVG com a moeda no centro e o link curto leva à inscrição da competição", async () => {
    const { gerarQrSvg } = await import("@/lib/qr");
    const svg = await gerarQrSvg("https://coins-pro-league.vercel.app/i/2");
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 37 37"/); // versão 4 com margem: quadradinhos maiores
    expect(svg).toContain('fill="#f5b53c"'); // a moeda
    const { GET } = await import("@/app/i/[id]/route");
    const r = await GET(new Request("https://x.dev/i/2"), { params: Promise.resolve({ id: "2" }) });
    expect([r.status, r.headers.get("location")]).toEqual([307, "https://x.dev/inscricao?c=2"]);
  });

  it("dados do OBS trazem o QR só quando há inscrição aberta", async () => {
    expect((await new ObsController(db).dados(null)).inscricao).toBeNull();
    const [copa] = await db
      .insert(schema.competicoes)
      .values({ temporadaId: ids.temporadaId, nome: "Copa Moeda", tipo: "copa", status: "inscricoes" })
      .returning();
    expect((await new ObsController(db).dados(null)).inscricao).toMatchObject({ link: `/i/${copa.id}`, qr: `/obs/qr?c=${copa.id}` });
  });
});
