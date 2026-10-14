// VIEW — base das telas do OBS: HTML puro com JavaScript simples, que roda até em
// versões antigas do navegador embutido do OBS. Fundo transparente e cores fixas da marca (escuro).

export const CSS_BASE = `
/* Identidade do canal thecoinsquash (mesmas cores e fonte das cenas do OBS) */
:root {
  --fundo-fundo: #070a10; --painel: #0b1019; --painel-2: #142030; --linha: #243149;
  --texto: #f7f8fb; --apagado: #9ea7b6; --ouro: #f5b53c; --sobre-ouro: #1b1203; --verde: #9bdb5c;
  --titulo: "Segoe UI", Inter, Arial, sans-serif; --corpo: "Segoe UI", Inter, Arial, sans-serif;
}
.hud { border: 2px solid rgba(245,181,60,.76); border-radius: 18px;
  box-shadow: 0 0 0 2px rgba(155,219,92,.22) inset, 0 0 28px rgba(0,0,0,.45), 0 0 22px rgba(155,219,92,.12);
  background: linear-gradient(180deg, rgba(10,15,24,.9), rgba(6,9,15,.82)); }
.rotulo { color: var(--verde); font-weight: 900; letter-spacing: .2em; text-transform: uppercase; }
html, body { margin: 0; padding: 0; width: 1920px; height: 1080px; overflow: hidden; background: transparent; }
body { font-family: var(--corpo); color: var(--texto); -webkit-font-smoothing: antialiased; }
.moeda { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid var(--ouro); background: var(--painel); overflow: hidden; box-sizing: border-box; padding: 4px; }
.moeda img { width: 100%; height: 100%; object-fit: contain; display: block; }
.moeda b { font-weight: 900; color: var(--apagado); font-size: 17px; line-height: 1; }
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
  // Assinatura do conteúdo (sem o horário da leitura): muda só quando algum dado muda de verdade
  assinatura: function (d) { var c = {}; for (var k in d) if (k !== "atualizadoEm") c[k] = d[k]; return JSON.stringify(c); },
  carregar: function (aoChegar) {
    var c = CPL.params.get("c");
    var url = "/obs/dados" + (c ? "?c=" + encodeURIComponent(c) : "");
    function buscar() {
      if (CPL.params.get("teste") === "1") { aoChegar(CPL.exemplo()); return; }
      fetch(url, { cache: "no-store" }).then(function (r) { return r.json(); }).then(aoChegar).catch(function () {});
    }
    buscar();
    setInterval(buscar, 20000);
  },
  // Dados de exemplo (?teste=1): para posicionar no OBS antes de a liga ter jogos
  exemplo: function () {
    var t = function (n) { return { nome: n, escudo: null }; };
    var j = function (id, m, v, gm, gv, q) { return { id: id, m: t(m), v: t(v), gm: gm, gv: gv, pm: null, pv: null, wo: false, quando: q, rodada: "Rodada 6", novo: id === 1 }; };
    return {
      competicao: { id: 1, nome: "Coin's Pro League", tipo: "liga" },
      resultados: { titulo: "Últimos resultados", jogos: [j(1, "Moeda FC", "Combo United", 3, 1), j(2, "Respawn AC", "Power-Up SC", 2, 2), j(3, "Level Up EC", "Lobby FC", 0, 1), j(4, "Coroa City", "Hexágono SC", 4, 2)] },
      proximos: { titulo: "Próximos jogos", jogos: [j(5, "Crossplay EC", "Fliperama FC", null, null, "qua. 14/10, 21:30"), j(6, "Turbo City", "Esmeralda AC", null, null, "qui. 15/10, 21:30"), j(7, "Jackpot SC", "Bônus AC", null, null, "sex. 16/10, 22:00")] },
      classificacao: [{ pos: 1, nome: "Moeda FC", escudo: null, pontos: 16, jogos: 6, saldo: 9 }, { pos: 2, nome: "Crossplay EC", escudo: null, pontos: 14, jogos: 6, saldo: 6 }, { pos: 3, nome: "Lobby FC", escudo: null, pontos: 12, jogos: 6, saldo: 4 }],
      artilharia: [{ pos: 1, atleta: "cifrao_7", clube: "Cifrão EC", escudo: null, gols: 7 }, { pos: 2, atleta: "power_6", clube: "Power-Up SC", escudo: null, gols: 6 }],
      inscricao: { competicao: "Copa Moeda", link: "/i/2", qr: "/obs/qr?c=2", ate: "qui. 22/10, 23:59" },
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
