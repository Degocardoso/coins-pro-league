// VIEW — card avulso da liga (para quem usa a moldura de gameplay como arquivo próprio).
// É a mesma peça das cenas hospedadas: /obs/cpl.js + /obs/cpl.css, na identidade do canal.
// Endereço: /obs/card?cena=01a (01a, 01c e 01f: card embaixo à esquerda; 01b, 01d e 01e: embaixo à direita)
// Opções: a_cada=10 (minutos), duracao=12 (segundos), teste=1 (dados de exemplo, a cada 20 s)

export const telaCard = () => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Card da Coin's Pro League</title>
<link rel="stylesheet" href="/obs/cpl.css">
<style>html, body { margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: transparent; }</style>
</head>
<body>
<script src="/obs/cpl.js"></script>
<script>
  var cena = (new URLSearchParams(location.search).get("cena") || "01a").toLowerCase();
  CPL.card({ lado: (cena === "01b" || cena === "01d" || cena === "01e") ? "direita" : "esquerda" });
</script>
</body>
</html>`;
