// VIEW — lista de clubes
import { criarClube } from "@/controllers/acoes/clube";
import type { ClubeController } from "@/controllers/ClubeController";
import { ELENCO_MAXIMO, ELENCO_MINIMO } from "@/controllers/regras/elenco";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Clube, Secao } from "../componentes";
import { CampoImagem } from "../CampoImagem";

type Lista = Awaited<ReturnType<ClubeController["listar"]>>;

export function ClubesView({ lista }: { lista: Lista }) {
  return (
    <>
      <Cabeca titulo="Clubes" descricao={`Elencos da temporada ativa, entre ${ELENCO_MINIMO} e ${ELENCO_MAXIMO} atletas.`} />
      {lista.length === 0 ? (
        <p className="vazio">Nenhum clube cadastrado.</p>
      ) : (
        <div className="rolagem">
        <table className="tabela">
          <thead><tr><th>Clube</th><th className="num">Elenco</th><th /></tr></thead>
          <tbody>
            {lista.map((c) => {
              const fora = c.elenco < ELENCO_MINIMO || c.elenco > ELENCO_MAXIMO;
              return (
                <tr key={c.id}>
                  <td><Clube nome={c.nome} escudoUrl={c.escudoUrl} href={`/admin/clubes/${c.id}`} /></td>
                  <td className="num" style={{ color: fora ? "var(--ouro-texto)" : undefined }} title={fora ? "Fora do limite de elenco" : undefined}>
                    {c.elenco}
                  </td>
                  <td className="acoes"><a className="btn btn-mini" href={`/admin/clubes/${c.id}`}>Elenco</a></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
      <Secao titulo="Novo clube">
        <FormAcao acao={criarClube}>
          <div className="linha-form">
            <Campo rotulo="Nome"><input type="text" name="nome" required /></Campo>
            <CampoImagem nome="escudo" rotulo="Escudo" proporcao="1 / 1" ajuste="contain" dica="Ideal: imagem quadrada, 512 × 512 px. PNG com fundo transparente fica melhor dentro do aro de moeda." />
            <Enviar>Criar clube</Enviar>
          </div>
        </FormAcao>
      </Secao>
    </>
  );
}
