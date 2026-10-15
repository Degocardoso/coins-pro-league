// Direito de acesso por área do painel. O dono acessa tudo e é o único que mexe na Equipe.

export const AREAS = [
  { chave: "competicoes", nome: "Competições", detalhe: "Criar competição, ficha, inscrições, gerar e apagar a tabela" },
  { chave: "resultados", nome: "Resultados", detalhe: "Horários, prazos das rodadas, lançar e desfazer resultado, W.O." },
  { chave: "clubes", nome: "Clubes", detalhe: "Clubes, escudos, elencos, capitães e atletas" },
  { chave: "noticias", nome: "Notícias", detalhe: "Escrever, editar e excluir notícias do jornal" },
  { chave: "regulamento", nome: "Regulamento", detalhe: "Editar o regulamento e as práticas proibidas" },
  { chave: "temporada", nome: "Temporada", detalhe: "Temporadas e janela de transferências" },
  { chave: "obs", nome: "OBS", detalhe: "Links das cenas e o botão da liga na live (ainda pede a senha do OBS)" },
] as const;

export type Area = (typeof AREAS)[number]["chave"];
export const CHAVES_AREAS = AREAS.map((a) => a.chave) as Area[];

type ComAcesso = { dono: boolean; areas: string[] };

export const podeAcessar = (admin: ComAcesso, area: Area) => admin.dono || admin.areas.includes(area);

/** Mantém só áreas que existem (o que vier do formulário pode ter qualquer coisa). */
export const areasValidas = (lista: unknown[]): Area[] =>
  CHAVES_AREAS.filter((a) => lista.includes(a));

export const nomeDaArea = (area: string) => AREAS.find((a) => a.chave === area)?.nome ?? area;
