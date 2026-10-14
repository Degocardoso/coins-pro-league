/* Coin's Pro League nas cenas do OBS (JavaScript de 2017: roda em qualquer versão do OBS).
   Lê /obs/dados a cada 20 s. Nomes de clubes e atletas entram sempre como texto, nunca como HTML.
   Botão "liga na live" desligado no admin: tudo da liga some da cena (inclusive no modo de teste).
   Opções pelo link da cena: ?teste=1 (dados de exemplo), &c=ID (outra competição),
   &a_cada=10 (minutos entre aparições do card), &duracao=12 (segundos do card na tela). */
(function () {
  var params = new URLSearchParams(location.search);
  var teste = params.get("teste") === "1";

  function el(tag, cls, texto) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto !== undefined && texto !== null) e.textContent = String(texto);
    return e;
  }
  function moeda(escudo, nome) {
    var m = el("span", "cpl-moeda");
    if (escudo && escudo.indexOf("/arquivos/") === 0) {
      var i = document.createElement("img"); i.src = escudo; i.alt = ""; m.appendChild(i);
    } else {
      m.appendChild(el("b", null, (nome || "?").charAt(0).toUpperCase()));
    }
    return m;
  }

  function exemplo() {
    var t = function (n) { return { nome: n, escudo: null }; };
    var j = function (id, m, v, gm, gv, q) { return { id: id, m: t(m), v: t(v), gm: gm, gv: gv, pm: null, pv: null, wo: false, quando: q, rodada: "Rodada 6", novo: id === 1 }; };
    return {
      ligaNaLive: true,
      competicao: { id: 1, nome: "Coin's Pro League", tipo: "liga" },
      resultados: { titulo: "Últimos resultados", jogos: [j(1, "Moeda FC", "Combo United", 3, 1), j(2, "Respawn AC", "Power-Up SC", 2, 2)] },
      proximos: { titulo: "Próximos jogos", jogos: [j(5, "Crossplay EC", "Fliperama FC", null, null, "qua. 14/10, 21:30")] },
      classificacao: [{ pos: 1, nome: "Moeda FC", escudo: null, pontos: 16, jogos: 6, saldo: 9 }],
      artilharia: [{ pos: 1, atleta: "cifrao_7", clube: "Cifrão EC", escudo: null, gols: 7 }],
      inscricao: { competicao: "Copa Moeda", link: "/i/2", qr: "/obs/qr?c=2", ate: "qui. 22/10, 23:59" },
      campeao: { competicao: "Coin's Pro League", nome: "Moeda FC", escudo: null, banner: null }
    };
  }

  // Busca única compartilhada por todas as peças da cena
  var ouvintes = [], ultimo = null, iniciado = false;
  function buscar() {
    var c = params.get("c");
    fetch("/obs/dados" + (c ? "?c=" + encodeURIComponent(c) : ""), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        // Modo de teste usa dados de exemplo, mas obedece ao botão do admin
        if (teste && d.ligaNaLive !== false) d = exemplo();
        entregar(d);
      })
      .catch(function () { if (teste) entregar(exemplo()); });
  }
  function entregar(d) { ultimo = d; ouvintes.forEach(function (fn) { fn(d); }); }
  function aoChegar(fn) {
    ouvintes.push(fn);
    if (ultimo) fn(ultimo);
    if (!iniciado) { iniciado = true; buscar(); setInterval(buscar, 20000); }
  }

  function confronto(j, meio, classeMeio) {
    var c = el("div", "cpl-corpo");
    c.appendChild(el("span", "cpl-nome m", j.m ? j.m.nome : "A definir"));
    c.appendChild(moeda(j.m && j.m.escudo, j.m ? j.m.nome : "?"));
    c.appendChild(el("span", "cpl-meio" + (classeMeio ? " " + classeMeio : ""), meio));
    c.appendChild(moeda(j.v && j.v.escudo, j.v ? j.v.nome : "?"));
    c.appendChild(el("span", "cpl-nome v", j.v ? j.v.nome : "A definir"));
    return c;
  }
  function topo(rotulo, extra, destaque) {
    var t = el("div", "cpl-topo");
    t.appendChild(el("span", "cpl-rotulo", rotulo));
    t.appendChild(el("small", destaque ? "destaque" : null, extra || "Coin's Pro League"));
    return t;
  }
  function pessoa(escudo, nomeClube, nome, detalhe, numero, unidade) {
    var c = el("div", "cpl-corpo");
    c.appendChild(moeda(escudo, nomeClube));
    var info = el("div", "cpl-info");
    info.appendChild(el("div", "cpl-nome", nome));
    info.appendChild(el("small", null, detalhe));
    c.appendChild(info);
    var g = el("span", "cpl-grande", numero); g.appendChild(el("small", null, unidade)); c.appendChild(g);
    return c;
  }
  function blocoQr(i) {
    var q = el("div", "cpl-qr");
    var img = document.createElement("img"); img.src = i.qr; img.alt = "QR code da inscrição";
    q.appendChild(img);
    var txt = el("div");
    txt.appendChild(el("span", "cpl-rotulo", "Inscrições abertas"));
    txt.appendChild(el("strong", null, "Inscreva seu clube"));
    txt.appendChild(el("p", null, "Aponte a câmera do celular para o QR code."));
    txt.appendChild(el("small", null, i.competicao + (i.ate ? ", até " + i.ate : "")));
    q.appendChild(txt);
    return q;
  }
  var saldo = function (s) { return s > 0 ? "+" + s : String(s); };

  // Assuntos do card: um por aparição, na ordem, pulando os que não têm dados
  function assuntos(d) {
    var lista = [];
    var prox = d.proximos && d.proximos.jogos.filter(function (j) { return j.quando; })[0];
    if (prox) lista.push([topo("Próximo jogo", prox.quando, true), confronto(prox, "×", "x")]);
    var res = d.resultados && d.resultados.jogos[0];
    if (res) lista.push([topo("Último resultado", res.rodada), confronto(res, res.gm + " × " + res.gv)]);
    var lider = d.classificacao && d.classificacao[0];
    if (lider) lista.push([topo("Líder da liga"), pessoa(lider.escudo, lider.nome, lider.nome, lider.jogos + " jogos, saldo " + saldo(lider.saldo), lider.pontos, "pts")]);
    var art = d.artilharia && d.artilharia[0];
    if (art) lista.push([topo("Artilheiro"), pessoa(art.escudo, art.clube, art.atleta, art.clube, art.gols, art.gols === 1 ? "gol" : "gols")]);
    if (d.inscricao && d.inscricao.qr) lista.push([blocoQr(d.inscricao)]);
    return lista;
  }

  /** Card da liga que entra de tempos em tempos. opcoes: { lado: "esquerda"|"direita", base: px do fim da tela } */
  function card(opcoes) {
    var lado = opcoes.lado === "direita" ? "direita" : "esquerda";
    var aCada = (Number(params.get("a_cada")) || opcoes.aCada || 10) * 60000;
    var duracao = (Number(params.get("duracao")) || opcoes.duracao || 12) * 1000;
    if (teste) { aCada = 20000; duracao = 8000; }
    var c = el("div", "cpl cpl-hud cpl-card " + lado);
    c.style.bottom = (opcoes.base || 24) + "px";
    document.body.appendChild(c);
    var dados = null, vez = 0, saindo = null, ultimoVisto = null, desligada = false;
    function mostrar(partes) {
      c.textContent = "";
      partes.forEach(function (e) { c.appendChild(e); });
      var comQr = !!c.querySelector(".cpl-qr");
      c.classList.add("visivel");
      clearTimeout(saindo);
      saindo = setTimeout(function () { c.classList.remove("visivel"); }, comQr ? Math.max(duracao, 20000) : duracao);
    }
    function aparecer() {
      if (desligada) return;
      var lista = dados ? assuntos(dados) : [];
      if (!lista.length || c.classList.contains("visivel")) return;
      mostrar(lista[vez++ % lista.length]);
    }
    aoChegar(function (d) {
      if (d.ligaNaLive === false) {
        // Desligada: some na hora e esquece o último resultado (ao religar, não solta "acabou de sair" antigo)
        desligada = true; dados = null; ultimoVisto = null;
        clearTimeout(saindo); c.classList.remove("visivel");
        return;
      }
      var r = d.resultados && d.resultados.jogos[0];
      var chave = r ? r.id + ":" + r.gm + "x" + r.gv : null;
      var primeira = !dados || desligada;
      desligada = false;
      dados = d;
      // Resultado novo lançado no admin: aparece na hora
      if (!primeira && chave && chave !== ultimoVisto) mostrar([topo("Acabou de sair", r.rodada, true), confronto(r, r.gm + " × " + r.gv)]);
      ultimoVisto = chave;
    });
    setTimeout(function () { aparecer(); setInterval(aparecer, aCada); }, teste ? 2000 : (opcoes.primeira || 60) * 1000);
  }

  /** Frases curtas da liga, para letreiros. */
  function frases(d) {
    var f = [];
    if (!d || !d.competicao) return f;
    var prox = d.proximos && d.proximos.jogos.filter(function (j) { return j.quando; })[0];
    if (prox && prox.m && prox.v) f.push("Próximo jogo da liga: " + prox.m.nome + " × " + prox.v.nome + ", " + prox.quando);
    var res = d.resultados && d.resultados.jogos[0];
    if (res && res.m && res.v) f.push("Liga: " + res.m.nome + " " + res.gm + " × " + res.gv + " " + res.v.nome);
    var lider = d.classificacao && d.classificacao[0];
    if (lider) f.push("Líder da liga: " + lider.nome + ", " + lider.pontos + " pts");
    var art = d.artilharia && d.artilharia[0];
    if (art) f.push("Artilheiro: " + art.atleta + ", " + art.gols + (art.gols === 1 ? " gol" : " gols"));
    if (d.inscricao) f.push("Inscrições abertas: " + d.inscricao.competicao);
    return f;
  }

  /** Painel fixo com o QR code, visível só com inscrição aberta. opcoes: { x, y } */
  function painelQr(opcoes) {
    var p = el("div", "cpl cpl-hud cpl-painel-qr");
    p.style.left = opcoes.x + "px"; p.style.top = opcoes.y + "px";
    document.body.appendChild(p);
    var mostrado = "";
    aoChegar(function (d) {
      var i = d.inscricao && d.inscricao.qr ? d.inscricao : null;
      var chave = i ? i.qr + "|" + i.competicao + "|" + i.ate : "";
      if (chave === mostrado) return;
      mostrado = chave;
      p.textContent = "";
      if (!i) { p.classList.remove("visivel"); return; }
      p.appendChild(el("span", "cpl-rotulo", "Inscrições abertas"));
      var img = document.createElement("img"); img.src = i.qr; img.alt = "QR code da inscrição"; p.appendChild(img);
      p.appendChild(el("strong", null, "Inscreva seu clube"));
      p.appendChild(el("p", null, i.competicao + (i.ate ? ", até " + i.ate : "")));
      p.classList.add("visivel");
    });
  }

  /** Reveza uma faixa já existente da cena: o conteúdo original e os itens da liga, um de cada vez. */
  function revezar(faixa, opcoes) {
    var original = [].slice.call(faixa.childNodes);
    var tempoProprio = (opcoes && opcoes.tempoProprio) || 12000, tempoLiga = (opcoes && opcoes.tempoLiga) || 7000;
    var dados = null, fila = [], estado = "proprio";
    aoChegar(function (d) {
      dados = d;
      // Desligada no meio de um item da liga: volta na hora para o conteúdo original
      if (d.ligaNaLive === false) { fila = []; if (estado === "liga") { estado = "proprio"; trocar(original); } }
    });
    function itensLiga(d) {
      var itens = [];
      var res = d.resultados && d.resultados.jogos[0];
      if (res) { var a = el("div", "cpl cpl-faixa"); a.appendChild(el("span", "cpl-rotulo", "Liga")); a.appendChild(confronto(res, res.gm + " × " + res.gv)); itens.push(a); }
      var prox = d.proximos && d.proximos.jogos.filter(function (j) { return j.quando; })[0];
      if (prox) { var b = el("div", "cpl cpl-faixa"); b.appendChild(el("span", "cpl-rotulo", "Próximo jogo")); b.appendChild(confronto(prox, "×", "x")); b.appendChild(el("span", "cpl-faixa-texto", prox.quando)); itens.push(b); }
      var lider = d.classificacao && d.classificacao[0];
      if (lider) { var c = el("div", "cpl cpl-faixa"); c.appendChild(el("span", "cpl-rotulo", "Líder")); c.appendChild(moeda(lider.escudo, lider.nome)); var t = el("span", "cpl-faixa-texto"); t.appendChild(document.createTextNode(lider.nome + " ")); t.appendChild(el("b", null, lider.pontos + " pts")); c.appendChild(t); itens.push(c); }
      if (d.inscricao) { var e = el("div", "cpl cpl-faixa"); e.appendChild(el("span", "cpl-rotulo", "Inscrições abertas")); var u = el("span", "cpl-faixa-texto"); u.appendChild(el("b", null, d.inscricao.competicao)); u.appendChild(document.createTextNode(d.inscricao.ate ? " até " + d.inscricao.ate : "")); e.appendChild(u); itens.push(e); }
      return itens;
    }
    function trocar(conteudo) {
      faixa.style.transition = "opacity .4s"; faixa.style.opacity = "0";
      setTimeout(function () {
        faixa.textContent = "";
        conteudo.forEach(function (n) { faixa.appendChild(n); });
        faixa.style.opacity = "1";
      }, 400);
    }
    function passo() {
      if (estado === "proprio") {
        if (!fila.length && dados) fila = itensLiga(dados);
        if (fila.length) { estado = "liga"; trocar([fila.shift()]); setTimeout(passo, tempoLiga); return; }
        setTimeout(passo, tempoProprio);
        return;
      }
      estado = "proprio"; trocar(original); setTimeout(passo, tempoProprio);
    }
    setTimeout(passo, tempoProprio);
  }

  window.CPL = { aoChegar: aoChegar, card: card, frases: frases, painelQr: painelQr, revezar: revezar, el: el, teste: teste };
})();
