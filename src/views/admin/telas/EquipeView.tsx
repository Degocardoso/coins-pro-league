// VIEW — Equipe: quem tem acesso ao painel e a quais áreas (só o dono vê e mexe)
import { criarPessoa, novaSenha, removerPessoa, salvarAcesso } from "@/controllers/acoes/equipe";
import { AREAS, nomeDaArea } from "@/lib/acesso";
import { formatarDataHora } from "@/lib/datas";
import { Enviar, FormAcao } from "../FormAcao";
import { Popup } from "../Popup";
import { Cabeca, Campo, Secao } from "../componentes";

type Pessoa = { id: number; nome: string; email: string; dono: boolean; areas: string[]; ultimoLoginEm: Date | null };

function MarcarAreas({ marcadas }: { marcadas: string[] }) {
  return (
    <fieldset className="areas-marcar" style={{ border: 0, padding: 0 }}>
      <legend className="sr-only">Áreas que a pessoa pode usar</legend>
      {AREAS.map((a) => (
        <label key={a.chave}>
          <input type="checkbox" name="areas" value={a.chave} defaultChecked={marcadas.includes(a.chave)} />
          <span><strong>{a.nome}</strong><small>{a.detalhe}</small></span>
        </label>
      ))}
    </fieldset>
  );
}

export function EquipeView({ pessoas }: { pessoas: Pessoa[] }) {
  return (
    <>
      <Cabeca
        titulo="Equipe"
        descricao="Quem tem acesso ao painel e a quais áreas. Todo mundo vê o Painel; o resto depende do que você marcar. Só você, o dono, mexe aqui."
      />

      <Secao titulo="Adicionar pessoa" dica="A senha é gerada na hora e aparece uma vez só. A pessoa pode trocar depois em Minha conta.">
        <FormAcao acao={criarPessoa} limparAoSalvar>
          <div className="campos">
            <Campo rotulo="Nome"><input type="text" name="nome" required maxLength={60} autoComplete="off" /></Campo>
            <Campo rotulo="E-mail (é o login)"><input type="email" name="email" required maxLength={120} autoComplete="off" /></Campo>
          </div>
          <MarcarAreas marcadas={["resultados"]} />
          <Enviar>Adicionar e gerar senha</Enviar>
        </FormAcao>
      </Secao>

      <Secao titulo={`Quem tem acesso (${pessoas.length})`}>
        <div className="rolagem">
          <table className="tabela">
            <thead>
              <tr><th>Pessoa</th><th>Pode usar</th><th>Último login</th><th /></tr>
            </thead>
            <tbody>
              {pessoas.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.nome}</strong>
                    <div style={{ color: "var(--apagado)", fontSize: 13 }}>{p.email}</div>
                  </td>
                  <td>
                    <div className="selos-areas">
                      {p.dono ? (
                        <span className="selo selo-ouro">Dono: tudo, inclusive a Equipe</span>
                      ) : p.areas.length ? (
                        p.areas.map((a) => <span key={a} className="selo selo-cinza">{nomeDaArea(a)}</span>)
                      ) : (
                        <span className="selo selo-cinza">Só o Painel</span>
                      )}
                    </div>
                  </td>
                  <td>{p.ultimoLoginEm ? formatarDataHora(p.ultimoLoginEm) : "Nunca entrou"}</td>
                  <td className="acoes">
                    {p.dono ? (
                      <a className="btn btn-mini" href="/admin/conta">Minha conta</a>
                    ) : (
                      <>
                        <Popup rotulo="Editar acesso" titulo={`Acesso de ${p.nome}`}>
                          <FormAcao acao={salvarAcesso}>
                            <input type="hidden" name="id" value={p.id} />
                            <Campo rotulo="Nome"><input type="text" name="nome" defaultValue={p.nome} required maxLength={60} /></Campo>
                            <MarcarAreas marcadas={p.areas} />
                            <Enviar>Salvar acesso</Enviar>
                          </FormAcao>
                        </Popup>
                        <FormAcao
                          acao={novaSenha}
                          semMensagem
                          rotuloConfirmar="Gerar senha nova"
                          confirmar={`Gerar uma senha nova para ${p.nome}? A senha atual para de funcionar e as sessões abertas caem na hora.`}
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <Enviar variante="normal" mini>Senha nova</Enviar>
                        </FormAcao>
                        <FormAcao
                          acao={removerPessoa}
                          semMensagem
                          perigo
                          rotuloConfirmar="Remover"
                          confirmar={`Remover ${p.nome} da equipe? Perde o acesso na hora, mesmo se estiver logado.`}
                        >
                          <input type="hidden" name="id" value={p.id} />
                          <Enviar variante="perigo" mini>Remover</Enviar>
                        </FormAcao>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>
    </>
  );
}
