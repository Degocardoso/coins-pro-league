// VIEW — cena do campeão (1920 × 1080): banner da ficha (se houver), nome do campeão e moedinhas subindo.
// Endereço: /obs/campeao (opções: c=ID da competição, teste=1 para ver com dados de exemplo)
import { pagina } from "./base";

const CSS = `
body { background:
  radial-gradient(circle at 50% 40%, rgba(155,219,92,.12), transparent 30%),
  radial-gradient(circle at 72% 60%, rgba(245,181,60,.10), transparent 28%),
  linear-gradient(135deg, #080b12, #101726); }
.grade { position: absolute; inset: -10%; pointer-events: none;
  background-image: linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
  background-size: 70px 70px; transform: perspective(700px) rotateX(66deg) translateY(35%); }
.moedas { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.moedinha { position: absolute; bottom: -90px; width: 56px; height: 56px; animation: sobe linear infinite; opacity: .85;
  filter: drop-shadow(0 6px 12px rgba(0,0,0,.5)); }
@keyframes sobe { from { transform: translateY(0) rotate(0); } to { transform: translateY(-1280px) rotate(360deg); } }
.palco { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; }
/* Moldura igual à da câmera do gameplay */
.moldura { position: relative; padding: 10px; border-radius: 26px; border: 4px solid var(--ouro);
  box-shadow: 0 0 0 3px rgba(155,219,92,.72) inset, 0 0 0 2px rgba(5,9,6,.9), 0 0 40px rgba(155,219,92,.3), 0 0 80px rgba(245,181,60,.15);
  background: rgba(6,9,15,.6); }
.moldura i { position: absolute; width: 54px; height: 54px; }
.moldura .tl { left: -12px; top: -12px; border-left: 7px solid var(--verde); border-top: 7px solid var(--verde); border-radius: 20px 0 0 0; }
.moldura .tr { right: -12px; top: -12px; border-right: 7px solid var(--verde); border-top: 7px solid var(--verde); border-radius: 0 20px 0 0; }
.moldura .bl { left: -12px; bottom: -12px; border-left: 7px solid var(--ouro); border-bottom: 7px solid var(--ouro); border-radius: 0 0 0 20px; }
.moldura .br { right: -12px; bottom: -12px; border-right: 7px solid var(--ouro); border-bottom: 7px solid var(--ouro); border-radius: 0 0 20px 0; }
.banner { display: block; max-width: 1240px; max-height: 600px; object-fit: contain; border-radius: 16px; }
.faixa { display: flex; align-items: center; gap: 28px; }
.faixa .moeda { width: 124px; height: 124px; border-width: 4px; padding: 12px; box-shadow: 0 0 30px rgba(245,181,60,.35); }
.faixa .moeda b { font-size: 58px; }
.titulos small { display: block; font-size: 24px; font-weight: 900; letter-spacing: .24em; text-transform: uppercase; color: var(--verde); }
.titulos strong { display: block; font-weight: 900; font-size: 104px; line-height: 1; letter-spacing: -.01em; color: var(--texto);
  text-shadow: 0 0 40px rgba(245,181,60,.25); margin-top: 6px; }
.sem-banner .faixa { flex-direction: column; text-align: center; gap: 34px; }
.sem-banner .faixa .moeda { width: 300px; height: 300px; border-width: 6px; padding: 30px; }
.sem-banner .faixa .moeda b { font-size: 140px; }
.sem-banner .titulos strong { font-size: 140px; }
.aguardando { font-size: 28px; color: var(--apagado); font-weight: 600; }
`;

const SCRIPT = `
var palco = document.getElementById("palco"), moedas = document.getElementById("moedas");
// Moedinhas subindo, como na abertura da live (posições fixas: a cena fica igual toda vez)
for (var i = 0; i < 16; i++) {
  var m = document.createElement("img"); m.className = "moedinha"; m.src = "/obs/assets/moeda.png"; m.alt = "";
  m.style.left = ((i * 53) % 100) + "%";
  m.style.animationDuration = (9 + (i * 7) % 8) + "s";
  m.style.animationDelay = (-((i * 13) % 17)) + "s";
  var t = 0.6 + ((i * 3) % 5) / 10; m.style.width = m.style.height = (56 * t) + "px";
  moedas.appendChild(m);
}
var mostrado = "";
CPL.carregar(function (d) {
  if (d.ligaNaLive === false) { mostrado = "desligada"; palco.textContent = ""; return; } // liga desligada: só o fundo
  var c = d.campeao;
  var chave = c ? [c.nome, c.escudo, c.banner, c.competicao].join("|") : "";
  if (chave === mostrado && palco.childNodes.length) return;
  mostrado = chave;
  palco.textContent = "";
  document.body.classList.toggle("sem-banner", !c || !c.banner);
  if (!c) { palco.appendChild(CPL.el("p", "aguardando", "O campeão aparece aqui quando a competição for encerrada no painel.")); return; }
  if (c.banner && c.banner.indexOf("/arquivos/") === 0) {
    var moldura = CPL.el("div", "moldura");
    ["tl", "tr", "bl", "br"].forEach(function (k) { moldura.appendChild(CPL.el("i", k)); });
    var img = document.createElement("img"); img.className = "banner"; img.src = c.banner; img.alt = "";
    moldura.appendChild(img);
    palco.appendChild(moldura);
  }
  var faixa = CPL.el("div", "faixa");
  faixa.appendChild(CPL.moeda(c.escudo, c.nome));
  var titulos = CPL.el("div", "titulos");
  titulos.appendChild(CPL.el("small", null, "Campeão da " + c.competicao));
  titulos.appendChild(CPL.el("strong", null, c.nome));
  faixa.appendChild(titulos);
  palco.appendChild(faixa);
});
`;

export const telaCampeao = () =>
  pagina("Campeão da Coin's Pro League", CSS, `<div class="grade"></div><div class="moedas" id="moedas"></div><div class="palco" id="palco"></div>`, SCRIPT);
