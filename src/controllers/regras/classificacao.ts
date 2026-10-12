// Regra: classificação da Liga (regulamento, seção 3).
// Vitória 3, empate 1, derrota 0.
// Desempate: vitórias, saldo, gols marcados, confronto direto e sorteio.
// W.O. conta como 3x0. W.O. duplo: os dois perdem por 0x3.

export type TipoWo = "mandante_vence" | "visitante_vence" | "duplo";

export type ResultadoTabela = {
  mandanteId: number;
  visitanteId: number;
  golsMandante: number | null;
  golsVisitante: number | null;
  wo: TipoWo | null;
};

export type LinhaClassificacao = {
  posicao: number;
  clubeId: number;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
  saldo: number;
  // true quando nem o confronto direto separou: a organização faz o sorteio
  precisaSorteio: boolean;
};

// [gols pró, gols contra] de cada lado
type Lados = { mandante: [number, number]; visitante: [number, number] };

function lados(r: ResultadoTabela): Lados | null {
  if (r.wo === "mandante_vence") return { mandante: [3, 0], visitante: [0, 3] };
  if (r.wo === "visitante_vence") return { mandante: [0, 3], visitante: [3, 0] };
  if (r.wo === "duplo") return { mandante: [0, 3], visitante: [0, 3] };
  if (r.golsMandante === null || r.golsVisitante === null) return null;
  return {
    mandante: [r.golsMandante, r.golsVisitante],
    visitante: [r.golsVisitante, r.golsMandante],
  };
}

function linhaVazia(clubeId: number): LinhaClassificacao {
  return {
    posicao: 0,
    clubeId,
    pontos: 0,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    saldo: 0,
    precisaSorteio: false,
  };
}

function registrar(l: LinhaClassificacao, pro: number, contra: number, duplo: boolean) {
  l.jogos++;
  l.golsPro += pro;
  l.golsContra += contra;
  l.saldo = l.golsPro - l.golsContra;
  if (duplo || pro < contra) l.derrotas++;
  else if (pro > contra) {
    l.vitorias++;
    l.pontos += 3;
  } else {
    l.empates++;
    l.pontos += 1;
  }
}

function acumular(clubeIds: number[], resultados: ResultadoTabela[]) {
  const linhas = new Map(clubeIds.map((id) => [id, linhaVazia(id)]));
  for (const r of resultados) {
    const m = linhas.get(r.mandanteId);
    const v = linhas.get(r.visitanteId);
    const l = lados(r);
    if (!m || !v || !l) continue;
    const duplo = r.wo === "duplo";
    registrar(m, l.mandante[0], l.mandante[1], duplo);
    registrar(v, l.visitante[0], l.visitante[1], duplo);
  }
  return linhas;
}

const chave = (l: LinhaClassificacao) => [l.pontos, l.vitorias, l.saldo, l.golsPro];

function compararPrincipal(a: LinhaClassificacao, b: LinhaClassificacao) {
  const ka = chave(a);
  const kb = chave(b);
  for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
  return 0;
}

export function calcularClassificacao(
  clubeIds: number[],
  resultados: ResultadoTabela[],
): LinhaClassificacao[] {
  const linhas = [...acumular(clubeIds, resultados).values()].sort(
    (a, b) => compararPrincipal(a, b) || a.clubeId - b.clubeId,
  );

  // Agrupa empatados nos critérios principais e resolve pelo confronto direto
  const final: LinhaClassificacao[] = [];
  let i = 0;
  while (i < linhas.length) {
    let j = i + 1;
    while (j < linhas.length && compararPrincipal(linhas[i], linhas[j]) === 0) j++;
    const grupo = linhas.slice(i, j);
    if (grupo.length === 1) final.push(grupo[0]);
    else {
      const ids = new Set(grupo.map((l) => l.clubeId));
      const entreEles = resultados.filter((r) => ids.has(r.mandanteId) && ids.has(r.visitanteId));
      const mini = acumular([...ids], entreEles);
      const pontosDiretos = (id: number) => mini.get(id)!.pontos;
      grupo.sort((a, b) => pontosDiretos(b.clubeId) - pontosDiretos(a.clubeId) || a.clubeId - b.clubeId);
      for (let k = 0; k < grupo.length; k++) {
        const empatadoAntes = k > 0 && pontosDiretos(grupo[k - 1].clubeId) === pontosDiretos(grupo[k].clubeId);
        const empatadoDepois =
          k < grupo.length - 1 && pontosDiretos(grupo[k + 1].clubeId) === pontosDiretos(grupo[k].clubeId);
        grupo[k].precisaSorteio = (empatadoAntes || empatadoDepois) && grupo[k].jogos > 0;
        final.push(grupo[k]);
      }
    }
    i = j;
  }

  final.forEach((l, idx) => (l.posicao = idx + 1));
  return final;
}
