// Regra: copas em mata-mata, jogo único (regulamento, seção 3).
// Empate => prorrogação; empate de novo => pênaltis.

import type { TipoWo } from "./classificacao";

// Uma vaga da partida: um clube já conhecido ou o vencedor de outra partida
export type Vaga = { clubeId: number } | { vencedorDe: { fase: number; ordem: number } };

export type PartidaChave = { fase: number; ordem: number; mandante: Vaga; visitante: Vaga };
export type FaseChave = { numero: number; nome: string; partidas: PartidaChave[] };

export function nomeDaFase(clubesNaFase: number): string {
  if (clubesNaFase === 2) return "Final";
  if (clubesNaFase === 4) return "Semifinal";
  if (clubesNaFase === 8) return "Quartas de final";
  if (clubesNaFase === 16) return "Oitavas de final";
  return `Fase de ${clubesNaFase}`;
}

// Posições dos cabeças de chave num chaveamento de tamanho potência de 2:
// 1x8, 4x5, 2x7, 3x6... assim o 1º e o 2º só se cruzam na final.
function posicoesDosCabecas(tamanho: number): number[] {
  let pos = [1, 2];
  while (pos.length < tamanho) {
    const total = pos.length * 2 + 1;
    pos = pos.flatMap((p) => [p, total - p]);
  }
  return pos;
}

/**
 * Gera a chave completa. A ordem dos clubes é a ordem do sorteio (ou do ranking):
 * quando o número de clubes não é potência de 2, os primeiros da lista ganham folga
 * e entram direto na segunda fase.
 */
export function gerarChave(clubeIds: number[]): FaseChave[] {
  if (clubeIds.length < 2) throw new Error("A copa precisa de pelo menos 2 clubes");
  if (new Set(clubeIds).size !== clubeIds.length) throw new Error("Clube repetido na lista");

  let tamanho = 2;
  while (tamanho < clubeIds.length) tamanho *= 2;

  let entradas: (Vaga | null)[] = posicoesDosCabecas(tamanho).map((cabeca) =>
    cabeca <= clubeIds.length ? { clubeId: clubeIds[cabeca - 1] } : null,
  );

  const fases: FaseChave[] = [];
  let numero = 1;
  let clubesNaFase = tamanho;

  while (entradas.length > 1) {
    const partidas: PartidaChave[] = [];
    const proximas: (Vaga | null)[] = [];
    for (let i = 0; i < entradas.length; i += 2) {
      const a = entradas[i];
      const b = entradas[i + 1];
      if (a && b) {
        const ordem = partidas.length + 1;
        partidas.push({ fase: numero, ordem, mandante: a, visitante: b });
        proximas.push({ vencedorDe: { fase: numero, ordem } });
      } else {
        proximas.push(a ?? b); // folga: avança sem jogar
      }
    }
    if (partidas.length > 0) {
      fases.push({ numero, nome: nomeDaFase(clubesNaFase), partidas });
      numero++;
    }
    entradas = proximas;
    clubesNaFase /= 2;
  }
  return fases;
}

export type ResultadoCopa = {
  mandanteId: number;
  visitanteId: number;
  golsMandante: number | null;
  golsVisitante: number | null;
  penaltisMandante: number | null;
  penaltisVisitante: number | null;
  wo: TipoWo | null;
};

/** Devolve o clube que avança, ou null se ainda não há como saber (ou W.O. duplo). */
export function vencedorDaPartida(r: ResultadoCopa): number | null {
  if (r.wo === "mandante_vence") return r.mandanteId;
  if (r.wo === "visitante_vence") return r.visitanteId;
  if (r.wo === "duplo") return null;
  if (r.golsMandante === null || r.golsVisitante === null) return null;
  if (r.golsMandante > r.golsVisitante) return r.mandanteId;
  if (r.golsVisitante > r.golsMandante) return r.visitanteId;
  if (r.penaltisMandante === null || r.penaltisVisitante === null) return null;
  if (r.penaltisMandante > r.penaltisVisitante) return r.mandanteId;
  if (r.penaltisVisitante > r.penaltisMandante) return r.visitanteId;
  return null;
}
