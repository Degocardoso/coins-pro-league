// VIEW — atalho da área Resultados: competições com tabela, para marcar horários e lançar jogos
import type { PainelController } from "@/controllers/PainelController";
import { Cabeca, Secao, Selo } from "../componentes";

type Competicoes = Awaited<ReturnType<PainelController["resumo"]>>["competicoes"];

export function ResultadosView({ competicoes }: { competicoes: Competicoes }) {
  const comTabela = competicoes.filter((c) => c.progresso.total > 0);
  return (
    <>
      <Cabeca titulo="Resultados" descricao="Horários combinados pelos capitães, prazos das rodadas e resultados enviados no Discord." />
      <Secao titulo="Competições com tabela">
        {comTabela.length === 0 ? (
          <p className="vazio">Nenhuma competição com tabela gerada ainda.</p>
        ) : (
          <div className="rolagem">
            <table className="tabela">
              <thead><tr><th>Competição</th><th>Situação</th><th className="num">Jogos com resultado</th><th /></tr></thead>
              <tbody>
                {comTabela.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.nome}</strong></td>
                    <td><Selo status={c.status} /></td>
                    <td className="num">{c.progresso.jogadas} de {c.progresso.total}</td>
                    <td className="acoes"><a className="btn btn-mini btn-ouro" href={`/admin/competicoes/${c.id}/partidas`}>Abrir rodadas</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>
    </>
  );
}
