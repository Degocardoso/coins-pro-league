// Equipe: acesso por área, dono protegido, senhas e sessões
import { beforeEach, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/models/schema";
import type { Db } from "@/models/db";
import { EquipeController } from "@/controllers/EquipeController";
import { AuthController } from "@/controllers/AuthController";
import { adminsRepo } from "@/models/repositories/cadastros";
import { areasValidas, podeAcessar } from "@/lib/acesso";
import { conferirSenha, gerarHashSenha } from "@/lib/seguranca";

let db: Db;
let donoId: number;
beforeEach(async () => {
  const pg = drizzle(new PGlite(), { schema, casing: "snake_case" });
  await migrate(pg, { migrationsFolder: "drizzle" });
  db = pg as unknown as Db;
  const [d] = await db.insert(schema.admins).values({ nome: "Dono", email: "dono@cpl.com", senhaHash: await gerarHashSenha("senha-do-dono-1"), dono: true }).returning();
  donoId = d.id;
});

describe("regra de acesso", () => {
  it("dono acessa tudo; os outros, só as áreas marcadas", () => {
    expect(podeAcessar({ dono: true, areas: [] }, "obs")).toBe(true);
    expect(podeAcessar({ dono: false, areas: ["resultados"] }, "resultados")).toBe(true);
    expect(podeAcessar({ dono: false, areas: ["resultados"] }, "clubes")).toBe(false);
    expect(areasValidas(["resultados", "equipe", "qualquer", "obs"])).toEqual(["resultados", "obs"]); // "equipe" não é área marcável
  });
});

describe("equipe", () => {
  it("cria com senha gerada que funciona no login, sem e-mail repetido e com pelo menos uma área", async () => {
    const eq = new EquipeController(db);
    const { admin, senha } = await eq.criar({ nome: "Ajudante", email: " Ajuda@CPL.com ", areas: ["resultados"] });
    expect([admin.email, admin.areas, admin.dono, senha.length]).toEqual(["ajuda@cpl.com", ["resultados"], false, 16]);
    expect((await new AuthController(db).login("ajuda@cpl.com", senha))?.id).toBe(admin.id);
    await expect(eq.criar({ nome: "Outro", email: "ajuda@cpl.com", areas: ["obs"] })).rejects.toThrow("Já existe");
    await expect(eq.criar({ nome: "Sem área", email: "x@cpl.com", areas: [] })).rejects.toThrow("pelo menos uma área");
  });

  it("dono não pode ser removido nem ter o acesso mudado", async () => {
    const eq = new EquipeController(db);
    await expect(eq.remover(donoId)).rejects.toThrow("não pode ser removido");
    await expect(eq.atualizarAcesso(donoId, { nome: "Dono", areas: ["obs"] })).rejects.toThrow("acesso a tudo");
  });

  it("muda acesso, gera senha nova (derruba sessões) e remove", async () => {
    const eq = new EquipeController(db);
    const { admin } = await eq.criar({ nome: "Ajudante", email: "a@cpl.com", areas: ["resultados"] });
    await eq.atualizarAcesso(admin.id, { nome: "Ajudante 2", areas: ["clubes", "noticias"] });
    expect((await adminsRepo.porId(db, admin.id))?.areas).toEqual(["clubes", "noticias"]);
    const antes = (await adminsRepo.porId(db, admin.id))!.versaoSessao;
    const { senha } = await eq.gerarNovaSenha(admin.id);
    const depois = (await adminsRepo.porId(db, admin.id))!;
    expect(depois.versaoSessao).toBe(antes + 1);
    expect(await conferirSenha(senha, depois.senhaHash)).toBe(true);
    expect(await eq.remover(admin.id)).toBe("Ajudante 2");
    expect(await adminsRepo.porId(db, admin.id)).toBeNull();
  });
});

describe("minha conta", () => {
  it("troca a própria senha conferindo a atual, o tamanho e a confirmação", async () => {
    const auth = new AuthController(db);
    await expect(auth.trocarMinhaSenha(donoId, "errada", "nova-senha-123", "nova-senha-123")).rejects.toThrow("atual não confere");
    await expect(auth.trocarMinhaSenha(donoId, "senha-do-dono-1", "curta", "curta")).rejects.toThrow("pelo menos 10");
    await expect(auth.trocarMinhaSenha(donoId, "senha-do-dono-1", "nova-senha-123", "outra-senha-12")).rejects.toThrow("confirmação");
    const novo = await auth.trocarMinhaSenha(donoId, "senha-do-dono-1", "nova-senha-123", "nova-senha-123");
    expect(novo.versaoSessao).toBe(1);
    expect(await auth.login("dono@cpl.com", "nova-senha-123")).not.toBeNull();
    expect(await auth.login("dono@cpl.com", "senha-do-dono-1")).toBeNull();
  });
});
