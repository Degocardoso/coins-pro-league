// VIEW — Minha conta: dados de quem está logado e troca da própria senha
import { trocarMinhaSenha } from "@/controllers/acoes/conta";
import { nomeDaArea } from "@/lib/acesso";
import { Enviar, FormAcao } from "../FormAcao";
import { Cabeca, Campo, Secao } from "../componentes";

export function ContaView({ eu }: { eu: { nome: string; email: string; dono: boolean; areas: string[] } }) {
  return (
    <>
      <Cabeca titulo="Minha conta" descricao={`${eu.nome}, ${eu.email}`} />
      <Secao titulo="O que você pode usar">
        <div className="selos-areas">
          {eu.dono ? (
            <span className="selo selo-ouro">Dono: tudo, inclusive a Equipe</span>
          ) : (
            <>
              <span className="selo selo-cinza">Painel</span>
              {eu.areas.map((a) => <span key={a} className="selo selo-cinza">{nomeDaArea(a)}</span>)}
            </>
          )}
        </div>
      </Secao>
      <Secao titulo="Trocar minha senha" dica="Pelo menos 10 caracteres. Os outros aparelhos onde você estiver logado são desconectados.">
        <FormAcao acao={trocarMinhaSenha} limparAoSalvar>
          <div className="campos">
            <Campo rotulo="Senha atual"><input type="password" name="atual" required autoComplete="current-password" /></Campo>
            <Campo rotulo="Senha nova"><input type="password" name="nova" required minLength={10} autoComplete="new-password" /></Campo>
            <Campo rotulo="Repita a senha nova"><input type="password" name="confirmacao" required minLength={10} autoComplete="new-password" /></Campo>
          </div>
          <Enviar>Trocar senha</Enviar>
        </FormAcao>
      </Secao>
    </>
  );
}
