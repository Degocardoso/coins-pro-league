// VIEW — lista de competições da temporada
import { criarCompeticao } from "@/controllers/acoes/competicao";
import type { competicoes } from "@/models/schema";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Secao, Selo } from "../componentes";

type Competicao = typeof competicoes.$inferSelect;

export function CompeticoesView({ lista, temporada, pendentes }: { lista: Competicao[]; temporada: string; pendentes: Map<number, number> }) {
  return (
    <>
      <Cabeca titulo="Competições" descricao={`Liga e copas da ${temporada}.`} />
      {lista.length === 0 ? (
        <p className="vazio">Nenhuma competição ainda. Comece criando a liga.</p>
      ) : (
        <div className="rolagem">
        <table className="tabela">
          <thead>
            <tr><th>Nome</th><th>Tipo</th><th>Situação</th><th className="num">Vagas</th><th /></tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>
                  <a href={`/admin/competicoes/${c.id}`}>{c.nome}</a>
                  {!c.ativa && <span className="selo selo-cinza" style={{ marginLeft: 8 }}>Desativada</span>}
                </td>
                <td>{c.tipo === "liga" ? "Liga" : "Copa"}</td>
                <td>
                  <Selo status={c.status} />
                  {(pendentes.get(c.id) ?? 0) > 0 && (
                    <a className="selo selo-ouro" style={{ marginLeft: 8, textDecoration: "none" }} href={`/admin/competicoes/${c.id}#inscricoes`}>
                      {pendentes.get(c.id)} para analisar
                    </a>
                  )}
                </td>
                <td className="num">{c.maxClubes}</td>
                <td className="acoes"><a className="btn btn-mini" href={`/admin/competicoes/${c.id}`}>Abrir</a></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <Secao titulo="Nova competição" dica="A liga é em pontos corridos, ida e volta. As copas são mata-mata em jogo único.">
        <FormAcao acao={criarCompeticao}>
          <div className="linha-form">
            <Campo rotulo="Tipo">
              <select name="tipo" defaultValue="liga">
                <option value="liga">Liga</option>
                <option value="copa">Copa</option>
              </select>
            </Campo>
            <Campo rotulo="Nome">
              <input type="text" name="nome" required placeholder="Coin's Pro League" />
            </Campo>
            <Enviar>Criar competição</Enviar>
          </div>
        </FormAcao>
      </Secao>
    </>
  );
}
