// VIEW — clube: nome, escudo, elenco e capitães
import { adicionarAtleta, alternarCapitao, removerAtleta, salvarClube } from "@/controllers/acoes/clube";
import type { ClubeController } from "@/controllers/ClubeController";
import { CAPITAES_POR_CLUBE, ELENCO_MAXIMO, ELENCO_MINIMO } from "@/controllers/regras/elenco";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Escudo, Secao } from "../componentes";

type Dados = NonNullable<Awaited<ReturnType<ClubeController["detalhe"]>>>;
const PLATAFORMA: Record<string, string> = { ps5: "PS5", xbox: "Xbox", pc: "PC" };

export function ClubeView({ dados, temporada, elencoLivre }: { dados: Dados; temporada: string | null; elencoLivre: boolean }) {
  const { clube, elenco } = dados;
  const capitaes = elenco.filter((e) => e.vinculo.capitao).length;
  return (
    <>
      <Cabeca titulo={clube.nome} voltar={{ href: "/admin/clubes", rotulo: "Clubes" }} />

      <Secao titulo="Dados do clube">
        <FormAcao acao={salvarClube}>
          <input type="hidden" name="id" value={clube.id} />
          <div className="linha-form">
            <Escudo url={clube.escudoUrl} nome={clube.nome} />
            <Campo rotulo="Nome"><input type="text" name="nome" defaultValue={clube.nome} required /></Campo>
            <Campo rotulo="Trocar escudo"><input type="file" name="escudo" accept="image/png,image/jpeg,image/webp" /></Campo>
            <Enviar>Salvar</Enviar>
          </div>
        </FormAcao>
      </Secao>

      {!temporada ? (
        <p className="vazio">Ative uma temporada para montar o elenco.</p>
      ) : (
        <>
          <Secao
            titulo={`Elenco da ${temporada} (${elenco.length})`}
            dica={
              <>
                Entre {ELENCO_MINIMO} e {ELENCO_MAXIMO} atletas, com {CAPITAES_POR_CLUBE} capitães ({capitaes} marcados).{" "}
                {elencoLivre
                  ? "A temporada ainda não começou: o elenco pode ser montado livremente."
                  : "A temporada já começou: entradas e saídas só durante a janela de transferências."}
              </>
            }
          >
            {elenco.length === 0 ? (
              <p className="vazio">Nenhum atleta no elenco.</p>
            ) : (
              <div className="rolagem">
                <table className="tabela">
                  <thead><tr><th>Personagem</th><th>Plataforma</th><th>ID na plataforma</th><th>Twitch</th><th>Capitão</th><th /></tr></thead>
                  <tbody>
                    {elenco.map(({ vinculo, atleta }) => (
                      <tr key={vinculo.id}>
                        <td>{atleta.nomePersonagem}</td>
                        <td>{PLATAFORMA[atleta.plataforma]}</td>
                        <td>{atleta.idPlataforma}</td>
                        <td>{atleta.twitch ?? ""}</td>
                        <td>
                          <FormAcao acao={alternarCapitao}>
                            <input type="hidden" name="clubeId" value={clube.id} />
                            <input type="hidden" name="vinculoId" value={vinculo.id} />
                            <input type="hidden" name="capitao" value={vinculo.capitao ? "0" : "1"} />
                            <Enviar variante={vinculo.capitao ? "ouro" : "normal"} mini>{vinculo.capitao ? "Capitão" : "Tornar capitão"}</Enviar>
                          </FormAcao>
                        </td>
                        <td className="acoes">
                          <FormAcao acao={removerAtleta} confirmar={`Liberar ${atleta.nomePersonagem} do elenco?`}>
                            <input type="hidden" name="clubeId" value={clube.id} />
                            <input type="hidden" name="atletaId" value={atleta.id} />
                            <Enviar variante="perigo" mini>Liberar</Enviar>
                          </FormAcao>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Secao>

          <Secao titulo="Adicionar atleta" dica="O nome do personagem é o que aparece no jogo e não pode mudar na temporada. Se o atleta já existir sem clube, ele é reaproveitado.">
            <FormAcao acao={adicionarAtleta} limparAoSalvar>
              <input type="hidden" name="clubeId" value={clube.id} />
              <div className="campos">
                <Campo rotulo="Nome do personagem"><input type="text" name="nomePersonagem" required maxLength={40} /></Campo>
                <Campo rotulo="Plataforma">
                  <select name="plataforma" defaultValue="ps5">
                    <option value="ps5">PS5</option>
                    <option value="xbox">Xbox Series</option>
                    <option value="pc">PC</option>
                  </select>
                </Campo>
                <Campo rotulo="PSN ID, Gamertag ou EA ID"><input type="text" name="idPlataforma" required maxLength={60} /></Campo>
                <Campo rotulo="Twitch (opcional)"><input type="text" name="twitch" maxLength={40} /></Campo>
              </div>
              <Enviar>Adicionar ao elenco</Enviar>
            </FormAcao>
          </Secao>
        </>
      )}
    </>
  );
}
