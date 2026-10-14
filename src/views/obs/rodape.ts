// VIEW — rodapé estilo ESPN: faixa de 1832 × 64 px na base da tela (Y 996 a 1060).
// Assuntos em sequência; 3 itens por página; destaque passando de item em item.
import { pagina } from "./base";

const CSS = `
.rodape { position: absolute; left: 44px; right: 44px; bottom: 20px; height: 64px; display: flex;
  background: var(--fundo-fundo); border: 1px solid var(--linha); box-sizing: border-box;
  opacity: 0; transition: opacity .6s; }
.rodape.visivel { opacity: 1; }
.rodape::before, .rodape::after { content: ""; position: absolute; width: 14px; height: 14px; border: 3px solid var(--ouro); }
.rodape::before { top: -3px; right: -3px; border-left: 0; border-bottom: 0; }
.rodape::after { bottom: -3px; right: -3px; border-left: 0; border-top: 0; }
.tag { flex: none; width: 300px; background: var(--ouro); color: var(--sobre-ouro); display: flex; flex-direction: column;
  justify-content: center; padding: 0 20px; box-sizing: border-box; overflow: hidden; }
.tag small { font-size: 13px; font-weight: 600; line-height: 1.1; }
.tag strong { font-family: var(--titulo); font-weight: 800; font-size: 25px; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.trilho { position: relative; flex: 1; overflow: hidden; }
.pagina { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; }
.pagina.entra { animation: entra .55s ease-out both; }
.pagina.sai { animation: sai .45s ease-in both; }
@keyframes entra { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes sai { from { transform: translateY(0); } to { transform: translateY(-100%); } }
.item { flex: 0 0 33.333%; min-width: 0; box-sizing: border-box; display: flex; align-items: center; gap: 12px;
  padding: 0 20px; border-left: 1px solid var(--linha); transition: background .3s, box-shadow .3s; }
.item.ativo { background: var(--painel-2); box-shadow: inset 0 -4px 0 var(--ouro); }
.item.largo { flex-basis: 100%; }
.nome { font-weight: 600; font-size: 19px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.nome.m { flex: 1; text-align: right; }
.nome.v { flex: 1; }
.placar { flex: none; font-family: var(--titulo); font-weight: 800; font-size: 30px; font-variant-numeric: tabular-nums; color: var(--ouro); }
.quando { flex: none; font-size: 15px; color: var(--apagado); text-align: center; line-height: 1.15; max-width: 92px; }
.pos { flex: none; font-family: var(--titulo); font-weight: 800; font-size: 28px; color: var(--ouro); width: 26px; text-align: right; }
.info { min-width: 0; flex: 1; }
.info .nome { display: block; }
.info small { display: block; font-size: 14px; color: var(--apagado); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.valor { flex: none; font-family: var(--titulo); font-weight: 800; font-size: 28px; font-variant-numeric: tabular-nums; }
.valor small { font-family: var(--corpo); font-size: 14px; font-weight: 500; color: var(--apagado); margin-left: 4px; }
.convite { font-size: 20px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.convite b { color: var(--ouro); font-weight: 700; }
`;

const SCRIPT = `
var POR_PAGINA = 3, TEMPO_ITEM = 2600;
var rodape = document.getElementById("rodape"), grupo = document.getElementById("grupo"), trilho = document.getElementById("trilho");
var dados = null, fila = [], indice = 0;

function itemJogo(j) {
  var it = CPL.el("div", "item");
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
  t.appendChild(document.createTextNode("Inscrições abertas para a "));
  t.appendChild(CPL.el("b", null, i.competicao));
  t.appendChild(document.createTextNode((i.ate ? " até " + i.ate : "") + ". Inscreva seu clube em " + location.host + i.link));
  it.appendChild(t);
  return it;
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
  if (d.inscricao) paginas.push({ titulo: "Inscrições", itens: [itemInscricao(d.inscricao)] });
  return paginas;
}

function mostrarProxima() {
  if (!fila.length || indice >= fila.length) { fila = dados ? montarFila(dados) : []; indice = 0; }
  if (!fila.length) { rodape.classList.remove("visivel"); setTimeout(mostrarProxima, 5000); return; }
  rodape.classList.add("visivel");
  var p = fila[indice++];
  grupo.textContent = p.titulo;
  var antiga = trilho.querySelector(".pagina:not(.sai)");
  if (antiga) { antiga.classList.add("sai"); setTimeout(function () { antiga.remove(); }, 500); }
  var nova = CPL.el("div", "pagina entra");
  p.itens.forEach(function (it) { nova.appendChild(it); });
  trilho.appendChild(nova);
  var n = 0;
  function destacar() {
    p.itens.forEach(function (it, i) { it.classList.toggle("ativo", i === n); });
    n++;
    if (n < p.itens.length) setTimeout(destacar, TEMPO_ITEM);
    else setTimeout(mostrarProxima, TEMPO_ITEM);
  }
  setTimeout(destacar, 400);
}

CPL.carregar(function (d) { var primeira = !dados; dados = d; if (primeira) mostrarProxima(); });
`;

export const telaRodape = () =>
  pagina(
    "Rodapé da Coin's Pro League",
    CSS,
    `<div class="rodape" id="rodape"><div class="tag"><small>Coin's Pro League</small><strong id="grupo"></strong></div><div class="trilho" id="trilho"></div></div>`,
    SCRIPT,
  );
