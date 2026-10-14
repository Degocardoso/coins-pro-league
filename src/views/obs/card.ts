// VIEW — card do gameplay: 560 × 140 px, entra de tempos em tempos no canto livre da cena.
// Endereço: /obs/card?cena=01a (01a e 01c: canto inferior esquerdo; 01b e 01d: inferior direito)
// Opções: a_cada=10 (minutos entre aparições), duracao=12 (segundos na tela), teste=1 (dados de exemplo, a cada 20 s)
// Inscrições abertas: o card cresce para 560 × 232 px com o QR code e fica 20 s na tela.
import { pagina } from "./base";

const CSS = `
.card { position: absolute; bottom: 24px; width: 560px; height: 140px; box-sizing: border-box; padding: 16px 20px 16px 22px;
  background: var(--fundo-fundo); border: 1px solid var(--linha); display: flex; flex-direction: column; justify-content: center;
  opacity: 0; transition: transform .6s cubic-bezier(.2,.8,.2,1), opacity .4s; }
.card.esquerda { left: 24px; transform: translateX(-640px); }
.card.direita { right: 24px; transform: translateX(640px); }
.card.visivel { transform: translateX(0); opacity: 1; }
.card::before, .card::after, .card i.ca, .card i.cb { content: ""; position: absolute; width: 16px; height: 16px; border: 3px solid var(--ouro); }
.card::before { top: -3px; left: -3px; border-right: 0; border-bottom: 0; }
.card::after { bottom: -3px; right: -3px; border-left: 0; border-top: 0; }
.card i.ca { top: -3px; right: -3px; border-left: 0; border-bottom: 0; }
.card i.cb { bottom: -3px; left: -3px; border-right: 0; border-top: 0; }
.topo { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.topo strong { font-family: var(--titulo); font-weight: 800; font-size: 24px; color: var(--ouro); line-height: 1; }
.topo small { font-size: 14px; color: var(--apagado); }
.topo small.destaque { font-size: 18px; font-weight: 600; color: var(--texto); }
.corpo { display: flex; align-items: center; gap: 12px; min-width: 0; }
.corpo .moeda { width: 46px; height: 46px; }
.corpo .moeda b { font-size: 21px; }
.nome { font-family: var(--titulo); font-weight: 800; font-size: 28px; line-height: 1.05; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.nome.m { flex: 1; text-align: right; }
.nome.v { flex: 1; }
.meio { flex: none; font-family: var(--titulo); font-weight: 800; font-size: 40px; color: var(--ouro); font-variant-numeric: tabular-nums; }
.meio.x { font-size: 26px; color: var(--apagado); }
.info { flex: 1; min-width: 0; }
.info small { display: block; font-size: 16px; color: var(--apagado); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.grande { flex: none; font-family: var(--titulo); font-weight: 900; font-size: 46px; color: var(--ouro); line-height: 1; }
.grande small { font-family: var(--corpo); font-size: 15px; font-weight: 600; color: var(--apagado); margin-left: 4px; }
.card.com-qr { height: 232px; }
.qr { display: flex; align-items: center; gap: 20px; }
.qr img { width: 196px; height: 196px; flex: none; display: block; background: #fff; border-radius: 6px; }
.qr strong { display: block; font-family: var(--titulo); font-weight: 800; font-size: 32px; line-height: 1; color: var(--ouro); }
.qr p { margin: 10px 0 0; font-size: 18px; line-height: 1.3; }
.qr small { display: block; margin-top: 10px; font-size: 15px; color: var(--apagado); line-height: 1.3; }
`;

const SCRIPT = `
var cena = (CPL.params.get("cena") || "01a").toLowerCase();
var lado = (cena === "01b" || cena === "01d") ? "direita" : "esquerda";
var teste = CPL.params.get("teste") === "1";
var aCada = (Number(CPL.params.get("a_cada")) || 10) * 60000;
var duracao = (Number(CPL.params.get("duracao")) || 12) * 1000;
if (teste) { aCada = 20000; duracao = 8000; }
var card = document.getElementById("card"), conteudo = document.getElementById("conteudo");
card.classList.add(lado);
var dados = null, vez = 0;

function topo(titulo, extra, destaque) {
  var t = CPL.el("div", "topo");
  t.appendChild(CPL.el("strong", null, titulo));
  t.appendChild(CPL.el("small", destaque ? "destaque" : null, extra || "Coin's Pro League"));
  return t;
}
function confronto(j, meio, classeMeio) {
  var c = CPL.el("div", "corpo");
  c.appendChild(CPL.el("span", "nome m", j.m ? j.m.nome : "A definir"));
  c.appendChild(CPL.moeda(j.m && j.m.escudo, j.m ? j.m.nome : "?"));
  c.appendChild(CPL.el("span", "meio" + (classeMeio ? " " + classeMeio : ""), meio));
  c.appendChild(CPL.moeda(j.v && j.v.escudo, j.v ? j.v.nome : "?"));
  c.appendChild(CPL.el("span", "nome v", j.v ? j.v.nome : "A definir"));
  return c;
}
function pessoa(escudo, nomeClube, nome, detalhe, numero, unidade) {
  var c = CPL.el("div", "corpo");
  c.appendChild(CPL.moeda(escudo, nomeClube));
  var info = CPL.el("div", "info");
  info.appendChild(CPL.el("div", "nome", nome));
  info.appendChild(CPL.el("small", null, detalhe));
  c.appendChild(info);
  var g = CPL.el("span", "grande", numero); g.appendChild(CPL.el("small", null, unidade)); c.appendChild(g);
  return c;
}

// Cada aparição mostra um assunto diferente, na ordem, pulando os que não têm dados
function assuntos(d) {
  var lista = [];
  var prox = d.proximos && d.proximos.jogos.filter(function (j) { return j.quando; })[0];
  if (prox) lista.push([topo("Próximo jogo", prox.quando, true), confronto(prox, "×", "x")]);
  var res = d.resultados && d.resultados.jogos[0];
  if (res) lista.push([topo("Último resultado", res.rodada), confronto(res, res.gm + " × " + res.gv)]);
  var lider = d.classificacao && d.classificacao[0];
  if (lider) lista.push([topo("Líder da liga"), pessoa(lider.escudo, lider.nome, lider.nome, lider.jogos + " jogos, saldo " + (lider.saldo > 0 ? "+" + lider.saldo : lider.saldo), lider.pontos, "pts")]);
  var art = d.artilharia && d.artilharia[0];
  if (art) lista.push([topo("Artilheiro"), pessoa(art.escudo, art.clube, art.atleta, art.clube, art.gols, art.gols === 1 ? "gol" : "gols")]);
  if (d.inscricao && d.inscricao.qr) {
    var q = CPL.el("div", "qr");
    var img = document.createElement("img"); img.src = d.inscricao.qr; img.alt = "QR code da inscrição";
    q.appendChild(img);
    var txt = CPL.el("div");
    txt.appendChild(CPL.el("strong", null, "Inscreva seu clube"));
    txt.appendChild(CPL.el("p", null, "Aponte a câmera do celular para o QR code."));
    txt.appendChild(CPL.el("small", null, d.inscricao.competicao + (d.inscricao.ate ? ", até " + d.inscricao.ate : "")));
    q.appendChild(txt);
    lista.push([q]);
  }
  return lista;
}

var saindo = null;
function mostrar(partes) {
  conteudo.textContent = "";
  partes.forEach(function (e) { conteudo.appendChild(e); });
  var comQr = !!conteudo.querySelector(".qr");
  card.classList.toggle("com-qr", comQr);
  card.classList.add("visivel");
  clearTimeout(saindo);
  // Com QR code, fica mais tempo para dar tempo de apontar o celular
  saindo = setTimeout(function () { card.classList.remove("visivel"); }, comQr ? Math.max(duracao, 20000) : duracao);
}
function aparecer() {
  var lista = dados ? assuntos(dados) : [];
  if (!lista.length || card.classList.contains("visivel")) return;
  mostrar(lista[vez++ % lista.length]);
}

// Resultado novo lançado no admin: o card aparece na hora, sem esperar o intervalo
var ultimoVisto = null;
function chaveResultado(d) {
  var r = d.resultados && d.resultados.jogos[0];
  return r ? r.id + ":" + r.gm + "x" + r.gv : null;
}
CPL.carregar(function (d) {
  var chave = chaveResultado(d), primeira = !dados;
  dados = d;
  if (!primeira && chave && chave !== ultimoVisto) {
    var r = d.resultados.jogos[0];
    mostrar([topo("Acabou de sair", r.rodada, true), confronto(r, r.gm + " × " + r.gv)]);
  }
  ultimoVisto = chave;
});
// Primeira aparição: 2 s no modo teste; senão, 1 minuto depois de a cena abrir
setTimeout(function () { aparecer(); setInterval(aparecer, aCada); }, teste ? 2000 : 60000);
`;

export const telaCard = () =>
  pagina(
    "Card da Coin's Pro League",
    CSS,
    `<div class="card" id="card"><i class="ca"></i><i class="cb"></i><div id="conteudo"></div></div>`,
    SCRIPT,
  );
