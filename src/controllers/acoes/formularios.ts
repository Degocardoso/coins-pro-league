// Leitura de formulários complexos (fora do arquivo "use server", que só exporta ações)
import { inteiro } from "@/lib/texto";
import type { EstatisticaLancada } from "../regras/resultado";

/** Lê a grade de atletas da tela de resultado. Quem tem qualquer número preenchido conta como "jogou". */
export function lerEstatisticas(form: FormData): EstatisticaLancada[] {
  const mvp = inteiro(form.get("mvp"));
  return form
    .getAll("atleta")
    .map((v) => String(v).split(":").map(Number))
    .flatMap(([atletaId, clubeId]) => {
      const n = (campo: string) => inteiro(form.get(`${campo}_${atletaId}`)) ?? 0;
      const linha: EstatisticaLancada = {
        atletaId,
        clubeId,
        gols: n("gols"),
        golsPenalti: n("pen"),
        assistencias: n("ast"),
        mvp: mvp === atletaId,
        goleiro: inteiro(form.get(`goleiro_${clubeId}`)) === atletaId,
        cartaoVermelho: form.get(`verm_${atletaId}`) === "on",
      };
      const jogou =
        form.get(`jogou_${atletaId}`) === "on" ||
        linha.gols > 0 || linha.assistencias > 0 || linha.mvp || linha.goleiro || linha.cartaoVermelho;
      return jogou ? [linha] : [];
    });
}

const PLATAFORMAS = ["ps5", "xbox", "pc"] as const;

/** Linhas do elenco do formulário de inscrição: campos a{n}_nome, a{n}_plat, a{n}_id, a{n}_cap. */
export function lerAtletasInscricao(form: FormData) {
  const indices = [...new Set([...form.keys()].map((k) => /^a(\d+)_nome$/.exec(k)?.[1]).filter(Boolean))] as string[];
  return indices
    .sort((x, y) => Number(x) - Number(y))
    .map((i) => ({
      nomePersonagem: String(form.get(`a${i}_nome`) ?? "").trim(),
      plataforma: PLATAFORMAS.find((p) => p === form.get(`a${i}_plat`)) ?? "ps5",
      idPlataforma: String(form.get(`a${i}_id`) ?? "").trim(),
      capitao: form.get(`a${i}_cap`) === "on",
    }))
    .filter((a) => a.nomePersonagem || a.idPlataforma);
}
