// Regra: rankings individuais da aba Tabela (regulamento, seção 10).
// Partidas decididas por W.O. não entram (o controller já filtra pelo status).

import { semSofrerGol } from "./resultado";

export type LinhaEstatistica = {
  atletaId: number;
  clubeId: number;
  gols: number;
  golsPenalti: number;
  assistencias: number;
  mvp: boolean;
  goleiro: boolean;
  golsSofridosPeloClube: number;
};

export type ItemRanking = { atletaId: number; clubeId: number; valor: number; jogos: number };

export type Rankings = {
  artilharia: ItemRanking[];
  assistencias: ItemRanking[];
  mvp: ItemRanking[];
  penaltis: ItemRanking[];
  semSofrerGol: ItemRanking[];
};

type Acumulado = {
  atletaId: number;
  clubeId: number;
  jogos: number;
  gols: number;
  penaltis: number;
  assistencias: number;
  mvp: number;
  semSofrerGol: number;
};

export function calcularRankings(linhas: LinhaEstatistica[], limite = 10): Rankings {
  const porAtleta = new Map<number, Acumulado>();
  for (const l of linhas) {
    const a =
      porAtleta.get(l.atletaId) ??
      { atletaId: l.atletaId, clubeId: l.clubeId, jogos: 0, gols: 0, penaltis: 0, assistencias: 0, mvp: 0, semSofrerGol: 0 };
    a.clubeId = l.clubeId; // clube mais recente, caso tenha sido transferido
    a.jogos++;
    a.gols += l.gols;
    a.penaltis += l.golsPenalti;
    a.assistencias += l.assistencias;
    if (l.mvp) a.mvp++;
    if (semSofrerGol(l, l.golsSofridosPeloClube)) a.semSofrerGol++;
    porAtleta.set(l.atletaId, a);
  }

  const todos = [...porAtleta.values()];
  const ranking = (campo: keyof Omit<Acumulado, "atletaId" | "clubeId" | "jogos">): ItemRanking[] =>
    todos
      .filter((a) => a[campo] > 0)
      // Empate no valor: quem precisou de menos jogos fica na frente
      .sort((x, y) => y[campo] - x[campo] || x.jogos - y.jogos || x.atletaId - y.atletaId)
      .slice(0, limite)
      .map((a) => ({ atletaId: a.atletaId, clubeId: a.clubeId, valor: a[campo], jogos: a.jogos }));

  return {
    artilharia: ranking("gols"),
    assistencias: ranking("assistencias"),
    mvp: ranking("mvp"),
    penaltis: ranking("penaltis"),
    semSofrerGol: ranking("semSofrerGol"),
  };
}
