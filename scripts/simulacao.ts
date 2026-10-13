// Simula resultados aleatórios nas primeiras rodadas da liga (só para testar o site).
import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "../src/models/db";
import { competicoes, vinculos } from "../src/models/schema";
import { partidasRepo } from "../src/models/repositories";
import { PartidaController } from "../src/controllers/PartidaController";
import { deInputLocal, paraInputLocal } from "../src/lib/datas";
import type { EstatisticaLancada } from "../src/controllers/regras/resultado";

const sorteio = (n: number) => Math.floor(Math.random() * n);
// Mesmo dia, às 21h30 de Brasília (horário das lives)
const as2130 = (ms: number) => deInputLocal(paraInputLocal(new Date(ms)).slice(0, 10) + "T21:30")!;
const golsAleatorios = () => [0, 0, 1, 1, 1, 2, 2, 3, 4][sorteio(9)];

export async function simular(db: Db, rodadas: number) {
  const [liga] = await db.select().from(competicoes).where(eq(competicoes.tipo, "liga")).limit(1);
  if (!liga) throw new Error("Nenhuma liga encontrada. Rode o seed primeiro.");
  const ctrl = new PartidaController(db);
  const todas = await partidasRepo.daCompeticao(db, liga.id);
  let lancadas = 0;
  const agora = Date.now();

  for (const { partida: p, rodadaNumero } of todas) {
    if (!p.mandanteId || !p.visitanteId) continue;
    if (rodadaNumero > rodadas) {
      // Rodada seguinte: só marca horário, para aparecer "Próximo jogo"
      if (rodadaNumero === rodadas + 1)
        await ctrl.agendar(p.id, as2130(agora + (1 + (p.ordem % 4)) * 86_400_000));
      continue;
    }
    const lado = async (clubeId: number, gols: number) => {
      const elenco = await db
        .select()
        .from(vinculos)
        .where(and(eq(vinculos.clubeId, clubeId), eq(vinculos.temporadaId, liga.temporadaId), isNull(vinculos.saidaEm)));
      const jogaram = elenco.sort(() => Math.random() - 0.5).slice(0, 5 + sorteio(Math.max(1, elenco.length - 4)));
      const linhas: EstatisticaLancada[] = jogaram.map((v, i) => ({
        atletaId: v.atletaId, clubeId, gols: 0, golsPenalti: 0, assistencias: 0, mvp: false,
        goleiro: i === 0 && Math.random() < 0.6, cartaoVermelho: Math.random() < 0.03,
      }));
      for (let g = 0; g < gols; g++) {
        if (Math.random() < 0.15) continue; // gol contra ou da IA
        const autor = linhas[1 + sorteio(linhas.length - 1)];
        autor.gols++;
        if (Math.random() < 0.12) autor.golsPenalti++;
        else if (Math.random() < 0.7) {
          const garcom = linhas[1 + sorteio(linhas.length - 1)];
          if (garcom !== autor) garcom.assistencias++;
        }
      }
      return linhas;
    };
    const gm = golsAleatorios();
    const gv = golsAleatorios();
    const estatisticas = [...(await lado(p.mandanteId, gm)), ...(await lado(p.visitanteId, gv))];
    const melhor = estatisticas.reduce((a, b) => (b.gols * 2 + b.assistencias > a.gols * 2 + a.assistencias ? b : a));
    melhor.mvp = true;
    await ctrl.agendar(p.id, as2130(agora - (rodadas - rodadaNumero + 1) * 3 * 86_400_000));
    const r = await ctrl.lancarResultado(p.id, { golsMandante: gm, golsVisitante: gv, estatisticas });
    if (r.ok) lancadas++;
  }
  return lancadas;
}
