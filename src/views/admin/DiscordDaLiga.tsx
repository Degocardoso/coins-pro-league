// VIEW — link de convite do Discord da liga (o capitão recebe logo depois de se inscrever)
import { salvarDiscord } from "@/controllers/acoes/competicao";
import { Enviar, FormAcao } from "./FormAcao";
import { Campo, Secao } from "./componentes";

export function DiscordDaLiga({ convite }: { convite: string | null }) {
  return (
    <Secao
      id="discord"
      titulo="Discord da liga"
      dica="Aparece para o capitão na tela de inscrição recebida. No Discord: Convidar pessoas > Editar link de convite > Expirar após: Nunca."
    >
      <FormAcao acao={salvarDiscord} className="linha-form">
        <Campo rotulo="Link de convite (vazio para remover)">
          <input type="text" name="convite" defaultValue={convite ?? ""} placeholder="https://discord.gg/..." maxLength={120} autoComplete="off" />
        </Campo>
        <Enviar>Salvar</Enviar>
      </FormAcao>
      {!convite && <div className="msg msg-alerta">Sem o link, a tela de inscrição só diz que a organização vai chamar o capitão no Discord.</div>}
    </Secao>
  );
}
