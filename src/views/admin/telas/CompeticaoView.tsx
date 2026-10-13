// VIEW — ficha da competição, inscrições e geração da tabela
import { acaoInscricao, gerarTabela, inscreverClube, salvarFicha } from "@/controllers/acoes/competicao";
import type { CompeticaoController } from "@/controllers/CompeticaoController";
import type { clubes } from "@/models/schema";
import { paraInputLocal } from "@/lib/datas";
import { reais } from "@/lib/texto";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Clube, Secao, Selo } from "../componentes";

type Competicao = NonNullable<Awaited<ReturnType<CompeticaoController["buscar"]>>>;
type Inscricoes = Awaited<ReturnType<CompeticaoController["inscricoes"]>>;
type ClubeLinha = typeof clubes.$inferSelect;

export function CompeticaoView({
  c,
  inscricoes,
  clubes,
  temPartidas,
}: {
  c: Competicao;
  inscricoes: Inscricoes;
  clubes: ClubeLinha[];
  temPartidas: boolean;
}) {
  const confirmadas = inscricoes.filter((i) => i.inscricao.status === "confirmada").length;
  const inscritos = new Set(inscricoes.map((i) => i.clube.id));
  const disponiveis = clubes.filter((cl) => !inscritos.has(cl.id));
  const data = (campo: keyof Competicao, rotulo: string) => (
    <Campo rotulo={rotulo}>
      <input type="datetime-local" name={campo} defaultValue={paraInputLocal(c[campo] as Date | null)} />
    </Campo>
  );

  return (
    <>
      <Cabeca
        titulo={c.nome}
        voltar={{ href: "/admin/competicoes", rotulo: "Competições" }}
        descricao={c.tipo === "liga" ? "Liga em pontos corridos, ida e volta." : "Copa em mata-mata, jogo único, com prorrogação e pênaltis."}
      />
      {temPartidas && (
        <p>
          <a className="btn btn-ouro" href={`/admin/competicoes/${c.id}/partidas`}>
            {c.tipo === "liga" ? "Rodadas e resultados" : "Chave e resultados"}
          </a>
        </p>
      )}

      <Secao titulo="Ficha da competição" dica="Esses valores aparecem no site e completam o regulamento.">
        <FormAcao acao={salvarFicha}>
          <input type="hidden" name="id" value={c.id} />
          <div className="campos">
            <Campo rotulo="Nome"><input type="text" name="nome" defaultValue={c.nome} required /></Campo>
            <Campo rotulo="Situação">
              <select name="status" defaultValue={c.status}>
                <option value="rascunho">Rascunho</option>
                <option value="inscricoes">Inscrições abertas</option>
                <option value="em_andamento">Em andamento</option>
                <option value="encerrada">Encerrada</option>
              </select>
            </Campo>
            <Campo rotulo="Vagas"><input type="number" name="maxClubes" min={2} max={64} defaultValue={c.maxClubes} /></Campo>
            <Campo rotulo="Taxa de inscrição (vazio = gratuita)">
              <input type="text" name="taxa" inputMode="decimal" placeholder="R$ 0,00" defaultValue={c.taxaCentavos ? reais(c.taxaCentavos) : ""} />
            </Campo>
            {data("inscricaoSubInicio", "Inscrição abre para subs")}
            {data("inscricaoInicio", "Inscrição abre para todos")}
            {data("inscricaoFim", "Inscrição fecha")}
            {data("dataInicio", "Começa em")}
            {data("dataFim", "Termina em")}
            <Campo rotulo="Premiação" largo>
              <textarea name="premio" defaultValue={c.premio ?? ""} placeholder="Valor do prêmio e como será pago" style={{ minHeight: 70 }} />
            </Campo>
            <Campo rotulo="Banner do campeão (PNG, JPG ou WEBP, até 3 MB)" largo>
              {c.bannerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="previa-imagem" src={c.bannerUrl} alt="Banner atual" />
              )}
              <input type="file" name="banner" accept="image/png,image/jpeg,image/webp" />
            </Campo>
          </div>
          <div className="linha-form" style={{ marginBottom: 4 }}>
            <label className="marcar"><input type="checkbox" name="ativa" defaultChecked={c.ativa} /> Competição ativa (aparece no site)</label>
            {c.bannerUrl && <label className="marcar"><input type="checkbox" name="removerBanner" /> Remover banner</label>}
          </div>
          <p><Enviar>Salvar ficha</Enviar></p>
        </FormAcao>
      </Secao>

      <Secao
        titulo={`Inscrições (${confirmadas} de ${c.maxClubes} vagas)`}
        dica={c.taxaCentavos ? "Com taxa, marque o pagamento antes de confirmar." : "Confirme os clubes aprovados. Sem vaga, o clube vai para a lista de espera."}
      >
        {inscricoes.length === 0 ? (
          <p className="vazio">Nenhuma inscrição ainda.</p>
        ) : (
          <div className="rolagem">
            <table className="tabela">
              <thead>
                <tr><th>Clube</th><th>Situação</th><th>Capitão sub</th>{c.taxaCentavos ? <th>Pagamento</th> : null}<th /></tr>
              </thead>
              <tbody>
                {inscricoes.map(({ inscricao: i, clube }) => {
                  const botao = (acao: string, rotulo: string, variante: "ouro" | "normal" | "perigo" = "normal", extra?: { valor: string }) => (
                    <FormAcao acao={acaoInscricao} semMensagem confirmar={acao === "remover" ? `Remover a inscrição do ${clube.nome}?` : undefined}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="inscricaoId" value={i.id} />
                      <input type="hidden" name="acao" value={acao} />
                      {extra && <input type="hidden" name="valor" value={extra.valor} />}
                      <Enviar variante={variante} mini>{rotulo}</Enviar>
                    </FormAcao>
                  );
                  return (
                    <tr key={i.id}>
                      <td><Clube nome={clube.nome} escudoUrl={clube.escudoUrl} href={`/admin/clubes/${clube.id}`} /></td>
                      <td>
                        <Selo status={i.status} />
                        {i.motivoRecusa && <span className="aviso-linha">{i.motivoRecusa}</span>}
                      </td>
                      <td>{botao("sub", i.capitaoSub ? "Sim" : "Não", "normal", { valor: i.capitaoSub ? "0" : "1" })}</td>
                      {c.taxaCentavos ? <td>{botao("pago", i.pago ? "Pago" : "Não pago", "normal", { valor: i.pago ? "0" : "1" })}</td> : null}
                      <td className="acoes">
                        {(i.status === "pendente" || i.status === "espera") && botao("confirmar", "Confirmar", "ouro")}
                        {i.status === "pendente" && (
                          <FormAcao acao={acaoInscricao} semMensagem>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="inscricaoId" value={i.id} />
                            <input type="hidden" name="acao" value="recusar" />
                            <input type="text" name="motivo" placeholder="Motivo da recusa" required style={{ width: 160, padding: "4px 8px", fontSize: 13 }} />{" "}
                            <Enviar variante="perigo" mini>Recusar</Enviar>
                          </FormAcao>
                        )}
                        {(i.status === "recusada" || i.status === "confirmada") && !temPartidas && botao("pendente", "Voltar para pendente")}
                        {!temPartidas && botao("remover", "Remover", "perigo")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!temPartidas && (
          <FormAcao acao={inscreverClube}>
            <input type="hidden" name="id" value={c.id} />
            <div className="linha-form" style={{ marginTop: 16 }}>
              <Campo rotulo="Inscrever um clube já cadastrado">
                <select name="clubeId" required defaultValue="">
                  <option value="" disabled>Escolha o clube</option>
                  {disponiveis.map((cl) => <option key={cl.id} value={cl.id}>{cl.nome}</option>)}
                </select>
              </Campo>
              <Enviar variante="normal">Inscrever</Enviar>
            </div>
          </FormAcao>
        )}
      </Secao>

      {!temPartidas && (
        <Secao
          titulo={c.tipo === "liga" ? "Gerar a tabela" : "Gerar a chave"}
          dica={
            c.tipo === "liga"
              ? `Cria todas as rodadas com os ${confirmadas} clubes confirmados. Depois disso, não dá para mudar os clubes.`
              : `Monta o mata-mata com os ${confirmadas} clubes confirmados. Se não fechar 4, 8 ou 16, os primeiros da ordem ganham folga.`
          }
        >
          <FormAcao acao={gerarTabela} confirmar="Gerar agora? Depois disso, os clubes da competição ficam fixos.">
            <input type="hidden" name="id" value={c.id} />
            <div className="linha-form">
              {c.tipo === "copa" && (
                <label className="marcar"><input type="checkbox" name="sortear" defaultChecked /> Sortear a ordem dos clubes</label>
              )}
              <Enviar>{c.tipo === "liga" ? "Gerar tabela" : "Gerar chave"}</Enviar>
            </div>
          </FormAcao>
        </Secao>
      )}
    </>
  );
}
