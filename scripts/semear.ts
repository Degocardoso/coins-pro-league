// Dados de teste: temporada 1, 16 clubes com 8 atletas cada e a Liga com inscrições confirmadas.
import type { Db } from "../src/models/db";
import { atletas, clubes, competicoes, inscricoes, paginas, temporadas, vinculos } from "../src/models/schema";
import { REGULAMENTO_OFICIAL } from "../src/models/conteudo/regulamento";

const NOMES_CLUBES = [
  "Moeda FC", "Trevo United", "Cifrão EC", "Jackpot SC", "Esmeralda AC", "Coroa City",
  "Fliperama FC", "Level Up EC", "Power-Up SC", "Combo United", "Respawn AC", "Lobby FC",
  "Crossplay EC", "Hexágono SC", "Turbo City", "Bônus AC",
];

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export async function semear(db: Db, opcoes: { atletasPorClube?: number } = {}) {
  const porClube = opcoes.atletasPorClube ?? 8;
  const agora = new Date();
  const emDias = (d: number) => new Date(agora.getTime() + d * 86_400_000);

  const [temporada] = await db
    .insert(temporadas)
    .values({ numero: 1, nome: "Temporada 1", ativa: true, janelaInicio: emDias(60), janelaFim: emDias(67) })
    .returning();

  const [liga] = await db
    .insert(competicoes)
    .values({ temporadaId: temporada.id, nome: "Coin's Pro League", tipo: "liga", status: "em_andamento", maxClubes: 16 })
    .returning();

  const plataformas = ["ps5", "xbox", "pc"] as const;
  for (const [i, nome] of NOMES_CLUBES.entries()) {
    const [clube] = await db.insert(clubes).values({ nome, slug: slug(nome) }).returning();
    for (let j = 0; j < porClube; j++) {
      const plataforma = plataformas[(i + j) % 3];
      const [atleta] = await db
        .insert(atletas)
        .values({
          nomePersonagem: `${slug(nome).split("-")[0]}_${j + 1}`,
          plataforma,
          idPlataforma: `${slug(nome)}-${j + 1}`,
        })
        .returning();
      await db.insert(vinculos).values({
        temporadaId: temporada.id,
        clubeId: clube.id,
        atletaId: atleta.id,
        capitao: j < 2,
        entradaEm: emDias(-1),
      });
    }
    await db.insert(inscricoes).values({ competicaoId: liga.id, clubeId: clube.id, status: "confirmada" });
  }

  await db
    .insert(paginas)
    .values([
      { slug: "regulamento", titulo: "Regulamento Oficial", conteudo: REGULAMENTO_OFICIAL },
      { slug: "proibidos", titulo: "Práticas proibidas", conteudo: "- Bugs, glitches e exploits conhecidos do jogo" },
    ])
    .onConflictDoNothing();

  return { temporadaId: temporada.id, ligaId: liga.id };
}
