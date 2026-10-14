// VIEW — base das telas do OBS: HTML puro com JavaScript simples, que roda até em
// versões antigas do navegador embutido do OBS. Fundo transparente e cores fixas da marca (escuro).

export const CSS_BASE = `
@font-face { font-family: "Big Shoulders"; src: url("/fonts/big-shoulders.woff2") format("woff2"); font-weight: 100 900; font-display: block; }
@font-face { font-family: "Instrument Sans"; src: url("/fonts/instrument-sans.woff2") format("woff2"); font-weight: 400 700; font-display: block; }
:root {
  --fundo-fundo: #070a10; --painel: #111926; --painel-2: #172133; --linha: #243149;
  --texto: #e9edf4; --apagado: #9ea7b6; --ouro: #f5b53c; --sobre-ouro: #1b1203; --verde: #9bdb5c;
  --titulo: "Big Shoulders", "Arial Narrow", sans-serif; --corpo: "Instrument Sans", system-ui, sans-serif;
}
html, body { margin: 0; padding: 0; width: 1920px; height: 1080px; overflow: hidden; background: transparent; }
body { font-family: var(--corpo); color: var(--texto); -webkit-font-smoothing: antialiased; }
.moeda { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid var(--ouro); background: var(--painel); overflow: hidden; box-sizing: border-box; padding: 4px; }
.moeda img { width: 100%; height: 100%; object-fit: contain; display: block; }
.moeda b { font-family: var(--titulo); font-weight: 800; color: var(--apagado); font-size: 17px; line-height: 1; }
`;

/** Funções do navegador: montar elementos (sempre com textContent) e buscar os dados a cada 30 s. */
export const JS_BASE = `
var CPL = {
  params: new URLSearchParams(location.search),
  el: function (tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto !== undefined && texto !== null) e.textContent = String(texto);
    return e;
  },
  moeda: function (escudo, nome, cls) {
    var m = CPL.el("span", "moeda" + (cls ? " " + cls : ""));
    if (escudo && escudo.indexOf("/arquivos/") === 0) {
      var i = document.createElement("img"); i.src = escudo; i.alt = ""; m.appendChild(i);
    } else {
      m.appendChild(CPL.el("b", null, (nome || "?").charAt(0).toUpperCase()));
    }
    return m;
  },
  carregar: function (aoChegar) {
    var c = CPL.params.get("c");
    var url = "/obs/dados" + (c ? "?c=" + encodeURIComponent(c) : "");
    function buscar() {
      if (CPL.params.get("teste") === "1") { aoChegar(CPL.exemplo()); return; }
      fetch(url, { cache: "no-store" }).then(function (r) { return r.json(); }).then(aoChegar).catch(function () {});
    }
    buscar();
    setInterval(buscar, 30000);
  },
  // Dados de exemplo (?teste=1): para posicionar no OBS antes de a liga ter jogos
  exemplo: function () {
    var t = function (n) { return { nome: n, escudo: null }; };
    var j = function (id, m, v, gm, gv, q) { return { id: id, m: t(m), v: t(v), gm: gm, gv: gv, pm: null, pv: null, wo: false, quando: q }; };
    return {
      competicao: { id: 1, nome: "Coin's Pro League", tipo: "liga" },
      resultados: { titulo: "Resultados: Rodada 6", jogos: [j(1, "Moeda FC", "Combo United", 3, 1), j(2, "Respawn AC", "Power-Up SC", 2, 2), j(3, "Level Up EC", "Lobby FC", 0, 1), j(4, "Coroa City", "Hexágono SC", 4, 2)] },
      proximos: { titulo: "Próximos jogos", jogos: [j(5, "Crossplay EC", "Fliperama FC", null, null, "qua. 14/10, 21:30"), j(6, "Turbo City", "Esmeralda AC", null, null, "qui. 15/10, 21:30"), j(7, "Jackpot SC", "Bônus AC", null, null, "sex. 16/10, 22:00")] },
      classificacao: [{ pos: 1, nome: "Moeda FC", escudo: null, pontos: 16, jogos: 6, saldo: 9 }, { pos: 2, nome: "Crossplay EC", escudo: null, pontos: 14, jogos: 6, saldo: 6 }, { pos: 3, nome: "Lobby FC", escudo: null, pontos: 12, jogos: 6, saldo: 4 }],
      artilharia: [{ pos: 1, atleta: "cifrao_7", clube: "Cifrão EC", escudo: null, gols: 7 }, { pos: 2, atleta: "power_6", clube: "Power-Up SC", escudo: null, gols: 6 }],
      inscricao: { competicao: "Copa Moeda", link: "/inscricao?c=2", ate: "qui. 22/10, 23:59" },
      campeao: { competicao: "Coin's Pro League", nome: "Moeda FC", escudo: null, banner: null }
    };
  }
};
`;

export function pagina(titulo: string, css: string, corpo: string, script: string) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>${titulo}</title>
<link rel="preload" href="/fonts/big-shoulders.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS_BASE}${css}</style>
</head>
<body>
${corpo}
<script>${JS_BASE}${script}</script>
</body>
</html>`;
}

export const respostaHtml = (html: string) =>
  new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, s-maxage=300", "X-Robots-Tag": "noindex" },
  });
