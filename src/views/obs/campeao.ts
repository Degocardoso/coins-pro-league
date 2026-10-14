// VIEW — cena do campeão (1920 × 1080): banner da ficha (se houver), nome do campeão e moedinhas subindo.
// Endereço: /obs/campeao (opções: c=ID da competição, teste=1 para ver com dados de exemplo)
import { pagina } from "./base";

const CSS = `
body { background: radial-gradient(ellipse at 50% 40%, #13203a 0%, #0b1019 55%, #070a10 100%); }
.moedas { position: absolute; inset: 0; overflow: hidden; }
.moedinha { position: absolute; bottom: -80px; width: 44px; height: 44px; border-radius: 50%; box-sizing: border-box;
  background: radial-gradient(circle at 35% 30%, #ffd987, #f5b53c 45%, #c8861c 100%); border: 3px solid #ffd987;
  box-shadow: inset 0 0 0 5px rgba(0,0,0,.12); animation: sobe linear infinite; opacity: .85; }
.moedinha::after { content: "$"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--titulo); font-weight: 900; font-size: 24px; color: #8a5a00; }
@keyframes sobe { from { transform: translateY(0) rotate(0); } to { transform: translateY(-1260px) rotate(360deg); } }
.palco { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 34px; }
.moldura { position: relative; padding: 14px; background: var(--fundo-fundo); border: 1px solid var(--linha); }
.moldura::before, .moldura::after, .moldura i.ca, .moldura i.cb { content: ""; position: absolute; width: 34px; height: 34px; border: 5px solid var(--ouro); }
.moldura::before { top: -5px; left: -5px; border-right: 0; border-bottom: 0; }
.moldura::after { bottom: -5px; right: -5px; border-left: 0; border-top: 0; }
.moldura i.ca { top: -5px; right: -5px; border-left: 0; border-bottom: 0; }
.moldura i.cb { bottom: -5px; left: -5px; border-right: 0; border-top: 0; }
.banner { display: block; max-width: 1280px; max-height: 620px; object-fit: contain; }
.faixa { display: flex; align-items: center; gap: 26px; }
.faixa .moeda { width: 120px; height: 120px; border-width: 4px; padding: 12px; }
.faixa .moeda b { font-size: 56px; }
.titulos small { display: block; font-size: 30px; font-weight: 600; color: var(--ouro); }
.titulos strong { display: block; font-family: var(--titulo); font-weight: 900; font-size: 110px; line-height: .95; }
.sem-banner .faixa { flex-direction: column; text-align: center; gap: 30px; }
.sem-banner .faixa .moeda { width: 300px; height: 300px; border-width: 6px; padding: 30px; }
.sem-banner .faixa .moeda b { font-size: 140px; }
.sem-banner .titulos strong { font-size: 150px; }
.aguardando { font-size: 30px; color: var(--apagado); }
`;

const SCRIPT = `
var palco = document.getElementById("palco"), moedas = document.getElementById("moedas");
// Moedinhas subindo, como na abertura da live (posições fixas: a cena fica igual toda vez)
for (var i = 0; i < 18; i++) {
  var m = CPL.el("span", "moedinha");
  m.style.left = ((i * 53) % 100) + "%";
  m.style.animationDuration = (9 + (i * 7) % 8) + "s";
  m.style.animationDelay = (-((i * 13) % 17)) + "s";
  var t = 0.6 + ((i * 3) % 5) / 10; m.style.width = m.style.height = (44 * t) + "px";
  moedas.appendChild(m);
}
var mostrado = "";
CPL.carregar(function (d) {
  var c = d.campeao;
  var chave = c ? [c.nome, c.escudo, c.banner, c.competicao].join("|") : "";
  if (chave === mostrado && palco.childNodes.length) return;
  mostrado = chave;
  palco.textContent = "";
  document.body.classList.toggle("sem-banner", !c || !c.banner);
  if (!c) { palco.appendChild(CPL.el("p", "aguardando", "O campeão aparece aqui quando a competição for encerrada no painel.")); return; }
  if (c.banner && c.banner.indexOf("/arquivos/") === 0) {
    var moldura = CPL.el("div", "moldura");
    moldura.appendChild(CPL.el("i", "ca")); moldura.appendChild(CPL.el("i", "cb"));
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
  pagina("Campeão da Coin's Pro League", CSS, `<div class="moedas" id="moedas"></div><div class="palco" id="palco"></div>`, SCRIPT);
