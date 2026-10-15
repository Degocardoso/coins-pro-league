// Regras da divulgação: transforma a ficha da competição no conteúdo das artes e nos textos dos posts.
// Lógica pura (sem banco), testada em tests/divulgacao.test.ts.
import { formatarDataHora } from "@/lib/datas";
import { reais } from "@/lib/texto";
import { situacaoInscricao } from "./elenco";

export type FichaDivulgacao = {
  id: number;
  nome: string;
  tipo: "liga" | "copa";
  status: string;
  maxClubes: number;
  taxaCentavos: number | null;
  premio: string | null;
  inscricaoSubInicio: Date | null;
  inscricaoInicio: Date | null;
  inscricaoFim: Date | null;
  temporada: string;
};

export type Estado = "aberta" | "em_breve" | "andamento";

export type ConteudoArte = {
  estado: Estado;
  nome: string;
  mostrarNome: boolean; // o logo já diz "Coin's Pro League": o nome só aparece se for outro (ex.: uma copa)
  eyebrow: string;
  titulo: [string, string]; // [parte branca, parte dourada]
  fatos: string[];
  cta: { rotulo: string; link: string };
  rodape: string;
};

const NOME_DO_LOGO = "coin's pro league";
const TWITCH = "twitch.tv/thecoinsquash";
const cortar = (t: string, max: number) => (t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t);

export function montarConteudo(c: FichaDivulgacao, origem: string, agora = new Date()): ConteudoArte {
  const host = origem.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const s = situacaoInscricao(agora, c);
  const estado: Estado = s.aberta
    ? "aberta"
    : c.status === "em_andamento" || c.status === "encerrada"
      ? "andamento"
      : "em_breve";
  const fatos = [
    c.tipo === "liga" ? `${c.maxClubes} clubes, ida e volta` : `Mata-mata, ${c.maxClubes} clubes`,
    "Crossplay PS5, Xbox e PC",
  ];
  // Com a competição rolando, a inscrição já fechou: a taxa não interessa mais
  // reais() usa espaço inquebrável depois do "R$": vira espaço comum, que cola certinho no WhatsApp e no X
  if (estado !== "andamento") fatos.push(c.taxaCentavos ? `Inscrição: ${reais(c.taxaCentavos).replace(/\s/g, " ")} por clube` : "Inscrição gratuita");
  if (c.premio?.trim()) fatos.push(`Premiação: ${cortar(c.premio.trim(), 48)}`);
  if (s.aberta && s.fechaEm) fatos.push(`Inscrições até ${formatarDataHora(s.fechaEm)}`);
  if (estado === "em_breve" && c.inscricaoInicio) fatos.push(`Inscrições a partir de ${formatarDataHora(c.inscricaoInicio)}`);

  const tipo = c.tipo === "liga" ? "a liga" : "a copa";
  return {
    estado,
    nome: c.nome,
    mostrarNome: c.nome.trim().toLowerCase() !== NOME_DO_LOGO,
    eyebrow: `${c.temporada} // EA SPORTS FC 27`,
    titulo: estado === "aberta" ? ["Inscrições", "abertas"] : estado === "em_breve" ? ["Inscrições", "em breve"] : ["Acompanhe", tipo],
    fatos,
    cta:
      estado === "andamento"
        ? { rotulo: "Tabela e jogos", link: `${host}/tabela?c=${c.id}` }
        : { rotulo: estado === "aberta" ? "Inscreva seu clube" : "Fique de olho", link: `${host}/i/${c.id}` },
    rodape: `Ao vivo em ${TWITCH}`,
  };
}

/** Tamanho de um post no X: link conta 23 caracteres e emoji conta 2. */
export function tamanhoNoX(texto: string) {
  const comLinks = texto.replace(/\S+\.\S+\/\S*/g, "x".repeat(23));
  return [...comLinks].reduce((n, ch) => n + ((ch.codePointAt(0) ?? 0) > 0x2000 ? 2 : 1), 0);
}

export function montarTextos(a: ConteudoArte) {
  const nome = a.nome;
  const abertura =
    a.estado === "aberta"
      ? `Inscrições abertas para a ${nome}, de Pro Clubs no *EA SPORTS FC 27*, da comunidade thecoinsquash!`
      : a.estado === "em_breve"
        ? `A ${nome} vem aí: Pro Clubs no *EA SPORTS FC 27*, da comunidade thecoinsquash!`
        : `A ${nome} está rolando: Pro Clubs no *EA SPORTS FC 27*, da comunidade thecoinsquash!`;
  const icones = ["⚽", "🎮", "💵", "💰", "⏰"];
  const linhas = a.fatos.map((f, i) => `${f.startsWith("Premiação") ? "💰" : f.startsWith("Inscrições") ? "⏰" : icones[i] ?? "▪️"} ${f}`);
  const chamada =
    a.estado === "aberta"
      ? `Monte seu elenco (de 7 a 18 jogadores) e inscreva seu clube:\n👉 ${a.cta.link}`
      : a.estado === "em_breve"
        ? `Fique de olho, o link de inscrição é este:\n👉 ${a.cta.link}`
        : `Tabela, jogos e artilharia:\n👉 ${a.cta.link}`;

  const whatsapp = [`🏆 *${nome.toUpperCase()}* 🏆`, abertura, "", ...linhas, "📺 Jogos e resultados na live da Twitch", "", chamada, "", "O regulamento completo está no site. Bora? 🔥"].join("\n");

  const instagram = [
    `🏆 ${a.titulo.join(" ").toUpperCase()} | ${nome.toUpperCase()}`,
    "",
    abertura.replace(/\*/g, ""),
    "",
    ...linhas,
    `📺 Jogos na live: ${a.rodape.replace("Ao vivo em ", "")}`,
    "",
    `${a.cta.rotulo}: ${a.cta.link}`,
    a.estado === "aberta" ? "(no story, é só tocar no link)" : "",
    "",
    "#EAFC27 #FC27 #ProClubs #ClubesFC #LigaProClubs #Crossplay #PS5 #Xbox",
  ]
    .filter((l, i, arr) => !(l === "" && arr[i - 1] === ""))
    .join("\n");

  // X: tenta a versão completa e vai tirando o que é opcional até caber em 280
  const essenciais = a.fatos.filter((f) => !f.startsWith("Premiação") && !f.startsWith("Inscrições até") && !f.startsWith("Inscrições a partir"));
  const opcionais = a.fatos.filter((f) => !essenciais.includes(f));
  const cabecaX =
    a.estado === "aberta" ? `🏆 Inscrições abertas: ${nome}, Pro Clubs no EA FC 27 da comunidade thecoinsquash.` : a.estado === "em_breve" ? `🏆 Vem aí: ${nome}, Pro Clubs no EA FC 27 da comunidade thecoinsquash.` : `🏆 ${nome} rolando: Pro Clubs no EA FC 27 da comunidade thecoinsquash.`;
  const ctaX = `${a.cta.rotulo} 👉 ${a.cta.link}`;
  // Mesma ordem da arte; "crossplay" em minúscula porque vem no meio da frase
  const basicos = essenciais.map((f, i) => (i > 0 && f.startsWith("Crossplay") ? "crossplay PS5, Xbox e PC" : f));
  const montarX = (cabeca: string, extras: string[], hashtags: boolean) =>
    `${cabeca}\n\n${[...basicos, ...extras].join(" · ")}.\n\n${ctaX}${hashtags ? "\n\n#EAFC27 #ProClubs" : ""}`;
  // Vai tirando o que é opcional (prêmio, prazo, hashtags) e, em último caso, encurta o nome
  const tentativas = [
    ...Array.from({ length: opcionais.length + 1 }, (_, i) => montarX(cabecaX, opcionais.slice(0, opcionais.length - i), true)),
    montarX(cabecaX, [], false),
    montarX(cabecaX.replace(nome, cortar(nome, 40)), [], false),
  ];
  const x = tentativas.find((t) => tamanhoNoX(t) <= 280) ?? tentativas[tentativas.length - 1];
  return { whatsapp, instagram, x };
}
