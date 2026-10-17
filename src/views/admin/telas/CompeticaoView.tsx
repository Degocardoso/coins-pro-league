// VIEW — ficha da competição, inscrições e geração da tabela
import { acaoInscricao, apagarTabela, excluirCompeticao, gerarTabela, inscreverClube, salvarFicha } from "@/controllers/acoes/competicao";
import type { CompeticaoController } from "@/controllers/CompeticaoController";
import type { clubes } from "@/models/schema";
import { paraInputLocal } from "@/lib/datas";
import { reais } from "@/lib/texto";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Clube, Secao, Selo } from "../componentes";
import { CampoImagem } from "../CampoImagem";
import { Divulgacao } from "../Divulgacao";
import { CopiarCurto } from "../CopiarCurto";
import { ArtesDivulgacao } from "../ArtesDivulgacao";

type Competicao = NonNullable<Awaited<ReturnType<CompeticaoController["buscar"]>>>;
type Inscricoes = Awaited<ReturnType<CompeticaoController["inscricoes"]>>;
type ClubeLinha = typeof clubes.$inferSelect;

export function CompeticaoView({
  c,
  inscricoes,
  clubes,
  temPartidas,
  resultados,
  podeResultados,
  divulgacao,
}: {
  c: Competicao;
  inscricoes: Inscricoes;
  clubes: ClubeLinha[];
  temPartidas: boolean;
  resultados: number;
  podeResultados: boolean;
  divulgacao: {
    textos: { whatsapp: string; instagram: string; x: string };
    convites: { chat: string; link: string; dm: string } | null;
    versao: number;
  } | null;
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
      {temPartidas && podeResultados && (
        <p>
          <a className="btn btn-ouro" href={`/admin/competicoes/${c.id}/partidas`}>
            {c.tipo === "liga" ? "Rodadas e resultados" : "Chave e resultados"}
          </a>
        </p>
      )}

      {c.status === "inscricoes" && (
        <Divulgacao competicaoId={c.id} nome={c.nome} />
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
            <CampoImagem
              nome="banner"
              rotulo="Banner do campeão"
              atual={c.bannerUrl}
              proporcao="16 / 9"
              ajuste="contain"
              dica="1920 × 1080 px (o mesmo da live). Aparece inteiro no site, sem cortes. PNG, JPG ou WEBP, até 3 MB."
            />
          </div>
          <div className="linha-form" style={{ marginBottom: 4 }}>
            <label className="marcar"><input type="checkbox" name="ativa" defaultChecked={c.ativa} /> Competição ativa (aparece no site)</label>
            {c.bannerUrl && <label className="marcar"><input type="checkbox" name="removerBanner" /> Remover banner</label>}
          </div>
          <p><Enviar>Salvar ficha</Enviar></p>
        </FormAcao>
      </Secao>

      {divulgacao && (
        <Secao
          titulo="Artes e textos para divulgar"
          dica="Saem da ficha acima: taxa, prêmio, prazo e a situação das inscrições. Salvou a ficha, as artes e os textos já mudam."
        >
          <ArtesDivulgacao competicaoId={c.id} textos={divulgacao.textos} convites={divulgacao.convites} versao={divulgacao.versao} />
        </Secao>
      )}

      <Secao
        id="inscricoes"
        titulo={`Inscrições (${confirmadas} de ${c.maxClubes} vagas)`}
        dica={c.taxaCentavos ? "Com taxa, marque o pagamento antes de confirmar." : "Confirme os clubes aprovados. Sem vaga, o clube vai para a lista de espera."}
      >
        {inscricoes.length === 0 ? (
          <p className="vazio">Nenhuma inscrição ainda.</p>
        ) : (
          <div className="rolagem">
            <table className="tabela">
              <thead>
                <tr><th>Clube</th><th>Discord do capitão</th><th>Situação</th><th>Capitão sub</th>{c.taxaCentavos ? <th>Pagamento</th> : null}<th /></tr>
              </thead>
              <tbody>
                {inscricoes.map(({ inscricao: i, clube }) => {
                  const botao = (acao: string, rotulo: string, variante: "ouro" | "normal" | "perigo" = "normal", extra?: { valor: string }) => (
                    <FormAcao
                      acao={acaoInscricao}
                      semMensagem
                      perigo={acao === "remover"}
                      rotuloConfirmar="Remover"
                      confirmar={acao === "remover" ? `Remover a inscrição do ${clube.nome}? O clube continua cadastrado.` : undefined}
                    >
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
                        {i.discordCapitao ? (
                          <CopiarCurto valor={i.discordCapitao} rotulo={`o Discord do capitão do ${clube.nome}`} />
                        ) : (
                          <span className="apagado" title="Inscrito pelo painel, sem o formulário do site">Não informado</span>
                        )}
                      </td>
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
          <FormAcao acao={gerarTabela} rotuloConfirmar="Gerar" confirmar="Gerar agora? Depois disso, os clubes da competição ficam fixos (dá para apagar a tabela e gerar de novo).">
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

      <Secao titulo="Zona de perigo">
        <div className="zona-perigo">
          {temPartidas && (
            <div>
              <p>
                <strong>Apagar a tabela</strong>
                <span>
                  Apaga todas as rodadas e partidas{resultados ? `, incluindo ${resultados} resultado(s) já lançado(s)` : ""}. As
                  inscrições continuam, e a tabela pode ser gerada de novo.
                </span>
              </p>
              <FormAcao
                acao={apagarTabela}
                semMensagem
                perigo
                rotuloConfirmar="Apagar a tabela"
                confirmar={`Apagar a tabela da ${c.nome}?${resultados ? ` Os ${resultados} resultado(s) lançado(s) e as estatísticas deles serão perdidos.` : ""}`}
              >
                <input type="hidden" name="id" value={c.id} />
                <Enviar variante="perigo">Apagar a tabela</Enviar>
              </FormAcao>
            </div>
          )}
          <div>
            <p>
              <strong>Excluir a competição</strong>
              <span>Apaga a competição, as inscrições e todas as partidas dela. Os clubes e atletas continuam cadastrados.</span>
            </p>
            <FormAcao
              acao={excluirCompeticao}
              semMensagem
              perigo
              rotuloConfirmar="Excluir competição"
              confirmar={`Excluir a ${c.nome} de vez?${resultados ? ` Ela tem ${resultados} resultado(s) lançado(s).` : ""} Não dá para desfazer.`}
            >
              <input type="hidden" name="id" value={c.id} />
              <Enviar variante="perigo">Excluir competição</Enviar>
            </FormAcao>
          </div>
        </div>
      </Secao>
    </>
  );
}
