// VIEW — rodapé estilo ESPN: faixa de 1832 × 64 px na base da tela (Y 996 a 1060).
// Assuntos em sequência; 3 itens por página; destaque passando de item em item.
// Inscrições abertas: um painel de 520 × 232 px com o QR code sobe à esquerda, colado no rodapé (Y 756 a 988).
import { pagina } from "./base";

const CSS = `
.rodape { position: absolute; left: 44px; right: 44px; bottom: 20px; height: 64px; display: flex; overflow: hidden;
  box-sizing: border-box; opacity: 0; transition: opacity .6s; }
.rodape.visivel { opacity: 1; }
.tag { flex: none; width: 300px; display: flex; flex-direction: column; justify-content: center; padding: 0 22px; box-sizing: border-box;
  overflow: hidden; border-right: 2px solid rgba(245,181,60,.45); }
.tag small { font-size: 12px; font-weight: 900; letter-spacing: .2em; text-transform: uppercase; color: var(--verde); line-height: 1.2; }
.tag strong { font-weight: 800; font-size: 22px; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trilho { position: relative; flex: 1; overflow: hidden; }
.pagina { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; }
.pagina.entra { animation: entra .55s ease-out both; }
.pagina.sai { animation: sai .45s ease-in both; }
@keyframes entra { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes sai { from { transform: translateY(0); } to { transform: translateY(-100%); } }
.item { flex: 0 0 33.333%; min-width: 0; box-sizing: border-box; display: flex; align-items: center; gap: 12px;
  padding: 0 20px; border-left: 1px solid var(--linha); transition: background .3s, box-shadow .3s; }
.item.ativo { background: rgba(155,219,92,.08); box-shadow: inset 0 -3px 0 var(--ouro); }
.novo { flex: none; font-size: 12px; font-weight: 700; color: var(--sobre-ouro); background: var(--verde); border-radius: 4px; padding: 2px 6px; margin-right: -4px; }
.item.largo { flex-basis: 100%; }
.nome { font-weight: 600; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.nome.m { flex: 1; text-align: right; }
.nome.v { flex: 1; }
.placar { flex: none; font-weight: 900; font-size: 28px; font-variant-numeric: tabular-nums; color: var(--ouro); }
.quando { flex: none; font-size: 15px; color: var(--apagado); text-align: center; line-height: 1.15; max-width: 92px; }
.pos { flex: none; font-weight: 900; font-size: 26px; color: var(--ouro); width: 26px; text-align: right; }
.info { min-width: 0; flex: 1; }
.info .nome { display: block; }
.info small { display: block; font-size: 14px; color: var(--apagado); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.valor { flex: none; font-weight: 900; font-size: 26px; font-variant-numeric: tabular-nums; }
.valor small { font-family: var(--corpo); font-size: 14px; font-weight: 500; color: var(--apagado); margin-left: 4px; }
.convite { font-size: 21px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.convite b { color: var(--ouro); font-weight: 700; }
.painel-qr { position: absolute; left: 44px; bottom: 92px; width: 520px; height: 232px; box-sizing: border-box; display: flex; align-items: center; gap: 22px;
  padding: 16px 22px 16px 16px; transform: translateY(40px); opacity: 0;
  transition: transform .5s cubic-bezier(.2,.8,.2,1), opacity .4s; }
.painel-qr.visivel { transform: translateY(0); opacity: 1; }
.painel-qr img { width: 196px; height: 196px; flex: none; display: block; background: #fff; border-radius: 12px; }
.painel-qr strong { display: block; font-weight: 900; font-size: 30px; line-height: 1.05; color: var(--ouro); }
.painel-qr p { margin: 10px 0 0; font-size: 18px; line-height: 1.3; }
.painel-qr small { display: block; margin-top: 10px; font-size: 15px; color: var(--apagado); line-height: 1.3; }
`;

const SCRIPT = `
var POR_PAGINA = 3, TEMPO_ITEM = 2600;
var rodape = document.getElementById("rodape"), grupo = document.getElementById("grupo"), trilho = document.getElementById("trilho");
var dados = null, fila = [], indice = 0;

function itemJogo(j) {
  var it = CPL.el("div", "item");
  if (j.novo) it.appendChild(CPL.el("span", "novo", "novo"));
  it.appendChild(CPL.el("span", "nome m", j.m ? j.m.nome : "A definir"));
  it.appendChild(CPL.moeda(j.m && j.m.escudo, j.m ? j.m.nome : "?"));
  if (j.gm !== null && j.gv !== null) {
    it.appendChild(CPL.el("span", "placar", j.gm + " × " + j.gv));
  } else {
    it.appendChild(CPL.el("span", "quando", j.quando || "a combinar"));
  }
  it.appendChild(CPL.moeda(j.v && j.v.escudo, j.v ? j.v.nome : "?"));
  it.appendChild(CPL.el("span", "nome v", j.v ? j.v.nome : "A definir"));
  return it;
}
function itemTabela(l) {
  var it = CPL.el("div", "item");
  it.appendChild(CPL.el("span", "pos", l.pos));
  it.appendChild(CPL.moeda(l.escudo, l.nome));
  var info = CPL.el("span", "info");
  info.appendChild(CPL.el("span", "nome", l.nome));
  info.appendChild(CPL.el("small", null, l.jogos + " jogos, saldo " + (l.saldo > 0 ? "+" + l.saldo : l.saldo)));
  it.appendChild(info);
  var v = CPL.el("span", "valor", l.pontos); v.appendChild(CPL.el("small", null, "pts"));
  it.appendChild(v);
  return it;
}
function itemArtilheiro(a) {
  var it = CPL.el("div", "item");
  it.appendChild(CPL.el("span", "pos", a.pos));
  it.appendChild(CPL.moeda(a.escudo, a.clube));
  var info = CPL.el("span", "info");
  info.appendChild(CPL.el("span", "nome", a.atleta));
  info.appendChild(CPL.el("small", null, a.clube));
  it.appendChild(info);
  var v = CPL.el("span", "valor", a.gols); v.appendChild(CPL.el("small", null, a.gols === 1 ? "gol" : "gols"));
  it.appendChild(v);
  return it;
}
function itemInscricao(i) {
  var it = CPL.el("div", "item largo");
  var t = CPL.el("span", "convite");
  t.appendChild(document.createTextNode("Abertas para a "));
  t.appendChild(CPL.el("b", null, i.competicao));
  t.appendChild(document.createTextNode((i.ate ? " até " + i.ate : "") + ". Aponte o celular para o QR code."));
  it.appendChild(t);
  return it;
}
// Painel com o QR code, que sobe do rodapé enquanto a página das inscrições está na tela
var painel = CPL.el("div", "painel-qr hud");
document.body.appendChild(painel);
function mostrarQr(i) {
  painel.textContent = "";
  var img = document.createElement("img"); img.src = i.qr; img.alt = "QR code da inscrição";
  painel.appendChild(img);
  var txt = CPL.el("div");
  txt.appendChild(CPL.el("strong", null, "Inscreva seu clube"));
  txt.appendChild(CPL.el("p", null, "Aponte a câmera do celular para o QR code."));
  txt.appendChild(CPL.el("small", null, i.competicao + (i.ate ? ", até " + i.ate : "")));
  painel.appendChild(txt);
  painel.classList.add("visivel");
}

// Monta a sequência de páginas: [{ titulo, itens: [elementos] }]
function montarFila(d) {
  var paginas = [];
  function adicionar(titulo, lista, criar) {
    for (var i = 0; i < lista.length; i += POR_PAGINA)
      paginas.push({ titulo: titulo, itens: lista.slice(i, i + POR_PAGINA).map(criar) });
  }
  if (d.resultados) adicionar(d.resultados.titulo, d.resultados.jogos, itemJogo);
  if (d.proximos) adicionar(d.proximos.titulo, d.proximos.jogos, itemJogo);
  if (d.classificacao && d.classificacao.length) adicionar("Classificação", d.classificacao, itemTabela);
  if (d.artilharia && d.artilharia.length) adicionar("Artilharia", d.artilharia, itemArtilheiro);
  if (d.inscricao && d.inscricao.qr) paginas.push({ titulo: "Inscrições", itens: [itemInscricao(d.inscricao)], qr: d.inscricao, tempo: 15000 });
  return paginas;
}

function mostrarProxima() {
  if (!fila.length || indice >= fila.length) { fila = dados ? montarFila(dados) : []; indice = 0; }
  if (!fila.length) { rodape.classList.remove("visivel"); painel.classList.remove("visivel"); setTimeout(mostrarProxima, 5000); return; }
  rodape.classList.add("visivel");
  var p = fila[indice++];
  grupo.textContent = p.titulo;
  if (p.qr) mostrarQr(p.qr); else painel.classList.remove("visivel");
  var antiga = trilho.querySelector(".pagina:not(.sai)");
  if (antiga) { antiga.classList.add("sai"); setTimeout(function () { antiga.remove(); }, 500); }
  var nova = CPL.el("div", "pagina entra");
  p.itens.forEach(function (it) { nova.appendChild(it); });
  trilho.appendChild(nova);
  var n = 0, tempoItem = p.tempo ? p.tempo / p.itens.length : TEMPO_ITEM;
  function destacar() {
    p.itens.forEach(function (it, i) { it.classList.toggle("ativo", i === n); });
    n++;
    if (n < p.itens.length) setTimeout(destacar, tempoItem);
    else setTimeout(mostrarProxima, tempoItem);
  }
  setTimeout(destacar, 400);
}

var assinaturaAtual = "", rodando = false;
CPL.carregar(function (d) {
  if (d.ligaNaLive === false) {
    // Liga desligada no admin: some na hora (a fila vazia mantém escondido até religar)
    fila = []; indice = 0; dados = d; assinaturaAtual = "";
    rodape.classList.remove("visivel"); painel.classList.remove("visivel");
    if (!rodando) { rodando = true; mostrarProxima(); } // o ciclo começa mesmo desligado, para voltar sozinho ao religar
    return;
  }
  var primeira = !rodando, assinatura = CPL.assinatura(d);
  if (!primeira && assinatura !== assinaturaAtual) { fila = []; indice = 0; } // dado novo: recomeça pelos últimos resultados na próxima página
  assinaturaAtual = assinatura;
  dados = d;
  if (primeira) { rodando = true; mostrarProxima(); }
});
`;

export const telaRodape = () =>
  pagina(
    "Rodapé da Coin's Pro League",
    CSS,
    `<div class="rodape hud" id="rodape"><div class="tag"><small>Coin's Pro League</small><strong id="grupo"></strong></div><div class="trilho" id="trilho"></div></div>`,
    SCRIPT,
  );
