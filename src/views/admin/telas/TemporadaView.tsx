// VIEW — temporadas e janela de transferências
import { ativarTemporada, criarTemporada, editarTemporada, excluirTemporada, salvarJanela } from "@/controllers/acoes/temporada";
import { Popup } from "../Popup";
import type { temporadas } from "@/models/schema";
import { paraInputLocal, formatarDataHora } from "@/lib/datas";
import { FormAcao, Enviar } from "../FormAcao";
import { Cabeca, Campo, Secao } from "../componentes";

type Temporada = typeof temporadas.$inferSelect;

export function TemporadaView({ lista }: { lista: Temporada[] }) {
  const ativa = lista.find((t) => t.ativa) ?? null;
  const proximoNumero = (lista[0]?.numero ?? 0) + 1;
  return (
    <>
      <Cabeca titulo="Temporada" descricao="Clubes, elencos e competições sempre usam a temporada ativa." />
      {ativa && (
        <Secao
          titulo={`Janela de transferências da ${ativa.nome}`}
          dica="Fora da janela, os elencos ficam congelados. Antes da primeira competição começar, os elencos podem ser montados livremente."
        >
          <FormAcao acao={salvarJanela}>
            <input type="hidden" name="id" value={ativa.id} />
            <div className="linha-form">
              <Campo rotulo="Abre em">
                <input type="datetime-local" name="inicio" defaultValue={paraInputLocal(ativa.janelaInicio)} />
              </Campo>
              <Campo rotulo="Fecha em">
                <input type="datetime-local" name="fim" defaultValue={paraInputLocal(ativa.janelaFim)} />
              </Campo>
              <Enviar>Salvar janela</Enviar>
            </div>
          </FormAcao>
        </Secao>
      )}
      <Secao titulo="Todas as temporadas">
        {lista.length === 0 ? (
          <p className="vazio">Nenhuma temporada criada.</p>
        ) : (
          <div className="rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Temporada</th><th>Janela</th><th /></tr>
            </thead>
            <tbody>
              {lista.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.nome} {t.ativa && <span className="selo selo-verde" style={{ marginLeft: 6 }}>Ativa</span>}
                  </td>
                  <td style={{ color: "var(--apagado)" }}>
                    {t.janelaInicio ? `${formatarDataHora(t.janelaInicio)} até ${formatarDataHora(t.janelaFim)}` : "Sem janela definida"}
                  </td>
                  <td className="acoes">
                    <Popup rotulo="Editar" titulo={`Editar ${t.nome}`}>
                      <FormAcao acao={editarTemporada}>
                        <input type="hidden" name="id" value={t.id} />
                        <div className="campos">
                          <Campo rotulo="Número"><input type="number" name="numero" min={1} defaultValue={t.numero} required /></Campo>
                          <Campo rotulo="Nome"><input type="text" name="nome" defaultValue={t.nome} required /></Campo>
                        </div>
                        <Enviar>Salvar</Enviar>
                      </FormAcao>
                    </Popup>
                    {!t.ativa && (
                      <FormAcao acao={ativarTemporada} semMensagem rotuloConfirmar="Ativar" confirmar={`Ativar a ${t.nome}? O painel passa a mostrar os dados dela.`}>
                        <input type="hidden" name="id" value={t.id} />
                        <Enviar variante="normal" mini>Ativar</Enviar>
                      </FormAcao>
                    )}
                    <FormAcao acao={excluirTemporada} semMensagem perigo confirmar={`Excluir a ${t.nome}? Só funciona se ela estiver vazia, sem competições e sem elencos.`}>
                      <input type="hidden" name="id" value={t.id} />
                      <Enviar variante="perigo" mini>Excluir</Enviar>
                    </FormAcao>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </Secao>
      <Secao titulo="Nova temporada">
        <FormAcao acao={criarTemporada} limparAoSalvar>
          <div className="linha-form">
            <Campo rotulo="Número">
              <input type="number" name="numero" min={1} defaultValue={proximoNumero} required style={{ width: 100 }} />
            </Campo>
            <Campo rotulo="Nome">
              <input type="text" name="nome" defaultValue={`Temporada ${proximoNumero}`} required />
            </Campo>
            <Enviar>Criar temporada</Enviar>
          </div>
        </FormAcao>
      </Secao>
    </>
  );
}
