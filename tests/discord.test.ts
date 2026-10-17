// Discord: usuário do capitão na inscrição e convite da liga
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { normalizarConviteDiscord, normalizarUsuarioDiscord } from "@/lib/discord";
import { DiscordController } from "@/controllers/DiscordController";

describe("usuário do Discord", () => {
  it("aceita o formato novo, o antigo e o @ na frente", () => {
    expect(normalizarUsuarioDiscord("fulano")).toBe("fulano");
    expect(normalizarUsuarioDiscord("  @f.ulano_2 ")).toBe("f.ulano_2");
    expect(normalizarUsuarioDiscord("Fulano#1234")).toBe("Fulano#1234");
  });
  it("recusa o que não é usuário", () => {
    for (const u of ["", "a", "fu lano", "x".repeat(33), "fulano#12", "<script>"]) expect(normalizarUsuarioDiscord(u), u).toBeNull();
  });
});

describe("convite do Discord", () => {
  it("aceita os formatos comuns e guarda sempre o curto", () => {
    for (const l of ["discord.gg/abc123", "https://discord.gg/abc123/", "https://discord.com/invite/abc123", "http://www.discordapp.com/invite/abc123"])
      expect(normalizarConviteDiscord(l), l).toBe("https://discord.gg/abc123");
  });
  it("recusa links que imitam o Discord ou têm lixo", () => {
    for (const l of ["https://evil.com/discord.gg/abc", "https://discord.gg.evil.com/abc", "discord.gg/", "https://discord.gg/abc?x=1", "javascript:alert(1)"])
      expect(normalizarConviteDiscord(l), l).toBeNull();
  });
});

describe("convite salvo no admin", () => {
  let db: Db;
  beforeEach(async () => {
    const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
    await migrate(pg, { migrationsFolder: "drizzle" });
    db = pg as unknown as Db;
  });
  it("salva no formato curto, recusa inválido e remove com vazio", async () => {
    const [a] = await db.insert(schema.admins).values({ nome: "Dono", email: "d@c.com", senhaHash: "x", dono: true }).returning();
    const d = new DiscordController(db);
    expect(await d.convite()).toBeNull();
    expect(await d.definir("https://discord.com/invite/CPL2026", a.id)).toBe("https://discord.gg/CPL2026");
    expect(await d.convite()).toBe("https://discord.gg/CPL2026");
    await expect(d.definir("https://evil.com/x", a.id)).rejects.toThrow("inválido");
    expect(await d.convite()).toBe("https://discord.gg/CPL2026"); // o inválido não apagou o que havia
    await d.definir("  ", a.id);
    expect(await d.convite()).toBeNull();
  });
});
