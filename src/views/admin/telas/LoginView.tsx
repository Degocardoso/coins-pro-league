// VIEW — login do painel
import { entrar } from "@/controllers/acoes/auth";
import { FormAcao, Enviar } from "../FormAcao";
import { Campo } from "../componentes";
import { SeletorTema } from "@/views/comum/SeletorTema";

export function LoginView() {
  return (
    <main className="adm login">
      <div className="login-caixa">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="logo-login" src="/liga/logo-720.webp" alt="" width={720} height={714} />
        <div className="marca">
          <span className="wordmark">the<b className="c">coin</b><b className="s">squash</b></span>
          <span className="sub">Pro League</span>
          <span className="temporada">Painel da organização</span>
        </div>
        <FormAcao acao={entrar}>
          <Campo rotulo="E-mail">
            <input type="email" name="email" required autoComplete="username" autoFocus />
          </Campo>
          <Campo rotulo="Senha">
            <input type="password" name="senha" required autoComplete="current-password" />
          </Campo>
          <Enviar>Entrar</Enviar>
        </FormAcao>
        <SeletorTema className="login-tema" />
      </div>
    </main>
  );
}
