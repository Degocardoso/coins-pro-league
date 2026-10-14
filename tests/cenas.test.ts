// Cenas do OBS hospedadas no site: caminhos certos e a peça da liga em cada uma
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const PASTA = "public/obs/cenas";
const cenas = readdirSync(PASTA).filter((a) => a.endsWith(".html"));
const ler = (a: string) => readFileSync(`${PASTA}/${a}`, "utf8");

describe("cenas do OBS", () => {
  it("todas as cenas esperadas existem", () => {
    for (const c of ["00_abertura", "01_gameplay_clean", "01a_gameplay_cam_sup_dir", "01b_gameplay_cam_sup_esq", "01c_gameplay_cam_inf_dir",
      "01d_gameplay_cam_inf_esq", "01e_gameplay_cam_meio_esq", "01f_gameplay_cam_meio_dir", "02_just_chatting", "02_just_chatting_moldura",
      "03_pausa", "04_encerramento", "05_alerta_teste"])
      expect(cenas).toContain(`${c}.html`);
  });

  it("nenhuma cena aponta para arquivo local (no site, só caminhos /obs/...)", () => {
    for (const c of cenas) expect(ler(c), c).not.toMatch(/src="(?!\/|https?:)[^"]+\.(png|svg|jpg)"/);
  });

  it("gameplay e just chatting têm o card da liga no lado oposto à câmera", () => {
    const lado = (c: string) => /CPL\.card\(\{ lado: "(\w+)"/.exec(ler(c))?.[1];
    expect(lado("01a_gameplay_cam_sup_dir.html")).toBe("esquerda");
    expect(lado("01b_gameplay_cam_sup_esq.html")).toBe("direita");
    expect(lado("01c_gameplay_cam_inf_dir.html")).toBe("esquerda");
    expect(lado("01d_gameplay_cam_inf_esq.html")).toBe("direita");
    expect(lado("01e_gameplay_cam_meio_esq.html")).toBe("direita");
    expect(lado("01f_gameplay_cam_meio_dir.html")).toBe("esquerda");
    expect(lado("02_just_chatting.html")).toBe("esquerda");
  });

  it("câmeras novas no meio da altura (Y 423) e contagens configuráveis pelo link", () => {
    for (const c of ["01e_gameplay_cam_meio_esq.html", "01f_gameplay_cam_meio_dir.html"]) expect(ler(c)).toContain("top:419px");
    expect(ler("00_abertura.html")).toContain('get("minutos")) || 3');
    expect(ler("03_pausa.html")).toContain('get("minutos")) || 5');
  });

  it("dados da liga entram só como texto: nenhuma peça usa innerHTML", () => {
    expect(readFileSync("public/obs/cpl.js", "utf8")).not.toMatch(/innerHTML|insertAdjacentHTML/);
    for (const c of cenas.filter((a) => ler(a).includes("cpl.js"))) {
      const blocoDaLiga = ler(c).split("Coin's Pro League").pop() ?? "";
      expect(blocoDaLiga, c).not.toMatch(/innerHTML/);
    }
  });
});
