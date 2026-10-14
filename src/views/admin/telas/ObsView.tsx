// VIEW — todas as cenas do OBS hospedadas no site, organizadas por categoria, com o link pronto para copiar.
// Protegida pela senha do OBS; no topo, o botão que liga ou desliga a liga em todas as cenas.
import { abrirObs, alternarLigaNaLive, fecharObs } from "@/controllers/acoes/obs";
import { formatarDataHora } from "@/lib/datas";
import { CopiarLink } from "../CopiarLink";
import { Enviar, FormAcao } from "../FormAcao";
import { Popup } from "../Popup";
import { Cabeca, Campo, Secao } from "../componentes";

type Cena = { caminho: string; nome: string; detalhe: string; camera?: string };

const CENAS_DA_LIVE: Cena[] = [
  { caminho: "/obs/cenas/00_abertura.html", nome: "00 Abertura", detalhe: "Contagem de 3 minutos. Para mudar, acrescente ?minutos=10 no fim do link. A liga entra no letreiro e o QR das inscrições aparece à direita." },
  { caminho: "/obs/cenas/02_just_chatting.html", nome: "02 Just Chatting (câmera cheia)", detalhe: "Chat Box do Streamlabs em X 1482, Y 222 (380 × 623, fundo transparente). Meta do LivePix em X 1164, Y 38. Textos do Streamlabs nas mesmas posições de antes.", camera: "X 0, Y 0, 1920 × 1080" },
  { caminho: "/obs/cenas/02_just_chatting_moldura.html", nome: "02 Just Chatting (com moldura, versão antiga)", detalhe: "A tela de antes, sem a liga.", camera: "X 44, Y 144, 1382 × 792" },
  { caminho: "/obs/cenas/03_pausa.html", nome: "03 Pausa", detalhe: "Contagem de 5 minutos (?minutos=10 para mudar). A faixa de baixo reveza os recados com a liga. QR das inscrições à direita, espelhando o do LivePix." },
  { caminho: "/obs/cenas/04_encerramento.html", nome: "04 Encerramento", detalhe: "Obrigado por assistir, com as redes." },
];

const GAMEPLAY: Cena[] = [
  { caminho: "/obs/cenas/01a_gameplay_cam_sup_dir.html", nome: "01a Câmera em cima à direita", detalhe: "Card da liga embaixo à esquerda.", camera: "X 1486, Y 12" },
  { caminho: "/obs/cenas/01b_gameplay_cam_sup_esq.html", nome: "01b Câmera em cima à esquerda", detalhe: "Card da liga embaixo à direita.", camera: "X 12, Y 12" },
  { caminho: "/obs/cenas/01c_gameplay_cam_inf_dir.html", nome: "01c Câmera embaixo à direita", detalhe: "Card da liga embaixo à esquerda.", camera: "X 1486, Y 834" },
  { caminho: "/obs/cenas/01d_gameplay_cam_inf_esq.html", nome: "01d Câmera embaixo à esquerda", detalhe: "Card da liga embaixo à direita.", camera: "X 12, Y 834" },
  { caminho: "/obs/cenas/01e_gameplay_cam_meio_esq.html", nome: "01e Câmera no meio à esquerda (nova)", detalhe: "Card da liga embaixo à direita. Texto do último sub: X 190, Y 708.", camera: "X 12, Y 423" },
  { caminho: "/obs/cenas/01f_gameplay_cam_meio_dir.html", nome: "01f Câmera no meio à direita (nova)", detalhe: "Card da liga embaixo à esquerda. Texto do último sub: X 1730, Y 708.", camera: "X 1486, Y 423" },
  { caminho: "/obs/cenas/01_gameplay_clean.html", nome: "01 Gameplay limpo (versão anterior)", detalhe: "Com a faixa da marca embaixo à esquerda. Card da liga embaixo à direita.", camera: "X 1440, Y 58" },
];

const LIGA: Cena[] = [
  { caminho: "/obs/campeao", nome: "Campeão", detalhe: "Cena inteira. Aparece quando a competição está como Encerrada, com o banner da ficha." },
  { caminho: "/obs/card?cena=01a", nome: "Card avulso", detalhe: "Só se usar uma moldura de gameplay que não seja daqui. Troque 01a pela cena (o lado do card segue a câmera)." },
  { caminho: "/obs/rodape", nome: "Rodapé avulso", detalhe: "Faixa de resultados na base da tela. Não use em cena que já tem faixa embaixo (abertura, pausa, just chatting, encerramento)." },
];

const TESTE: Cena[] = [
  { caminho: "/obs/cenas/01a_gameplay_cam_sup_dir.html?teste=1", nome: "Gameplay de teste", detalhe: "Dados de exemplo: o card aparece em 2 segundos e repete a cada 20. Vale ?teste=1 em qualquer cena." },
  { caminho: "/obs/campeao?teste=1", nome: "Campeão de teste", detalhe: "Com um campeão de exemplo, para posicionar." },
  { caminho: "/obs/cenas/05_alerta_teste.html", nome: "Alerta (teste visual)", detalhe: "Mostra um alerta falso a cada 12 segundos. Não é para usar na live." },
];

function Lista({ cenas }: { cenas: Cena[] }) {
  return (
    <div className="obs-lista">
      {cenas.map((c) => (
        <div key={c.caminho} className="obs-item">
          <div className="obs-cabeca">
            <strong>{c.nome}</strong>
            {c.camera && <span className="selo selo-ouro">Webcam: {c.camera}</span>}
          </div>
          <p className="dica-imagem">{c.detalhe}</p>
          <CopiarLink caminho={c.caminho} rotulo="Link" />
        </div>
      ))}
    </div>
  );
}

type EstadoLiga = { ligada: boolean; atualizadoEm: Date | null; por: string | null };

/** Página trancada: pede a senha do OBS (variável OBS_SENHA), separada do login. */
export function ObsBloqueadaView({ configurada }: { configurada: boolean }) {
  return (
    <>
      <Cabeca titulo="Cenas do OBS" descricao="Área protegida pela senha do OBS. Depois de aberta, fica liberada por 10 minutos." />
      <Secao titulo="Abrir a área do OBS">
        {configurada ? (
          <FormAcao acao={abrirObs} className="obs-senha">
            <Campo rotulo="Senha do OBS">
              <input type="password" name="senha" required autoComplete="off" autoFocus />
            </Campo>
            <Enviar>Abrir</Enviar>
          </FormAcao>
        ) : (
          <div className="msg msg-alerta">
            A senha do OBS ainda não foi configurada. Na Vercel, em <b>Settings &gt; Environment Variables</b>, crie a variável{" "}
            <b>OBS_SENHA</b> com pelo menos 8 caracteres e faça um <b>Redeploy</b>. No seu PC, coloque a mesma linha no <b>.env</b>.
          </div>
        )}
      </Secao>
    </>
  );
}

/** Botão geral: liga ou desliga tudo da liga em todas as cenas. Sempre pede a senha do OBS. */
function LigaNaLive({ liga }: { liga: EstadoLiga }) {
  const acao = liga.ligada ? "Desligar a liga" : "Ligar a liga";
  return (
    <section className={`liga-na-live ${liga.ligada ? "ligada" : "desligada"}`} aria-live="polite">
      <div className="liga-na-live-estado">
        <span className="rotulo-adm">Liga na live</span>
        <strong>{liga.ligada ? "Ligada" : "Desligada"}</strong>
        <p>
          {liga.ligada
            ? "As cenas mostram a liga: card, revezamento da pausa, letreiro, QR das inscrições, rodapé e campeão."
            : "Nada da liga aparece nas cenas. Os links continuam os mesmos."}
          {liga.atualizadoEm && <> Última troca: {formatarDataHora(liga.atualizadoEm)}{liga.por ? `, por ${liga.por}` : ""}.</>}
        </p>
      </div>
      <div className="liga-na-live-acoes">
        <Popup rotulo={acao} titulo={acao} mini={false} variante={liga.ligada ? "perigo" : "ouro"}>
          <FormAcao acao={alternarLigaNaLive}>
            <input type="hidden" name="ligar" value={liga.ligada ? "0" : "1"} />
            <p className="dialogo-texto">
              {liga.ligada
                ? "Tudo da liga some das cenas do OBS em até 20 segundos."
                : "A liga volta a aparecer nas cenas do OBS em até 20 segundos."}{" "}
              Digite a senha do OBS para confirmar.
            </p>
            <Campo rotulo="Senha do OBS">
              <input type="password" name="senha" required autoComplete="off" />
            </Campo>
            <div className="dialogo-acoes">
              <Enviar variante={liga.ligada ? "perigo" : "ouro"}>{acao}</Enviar>
            </div>
          </FormAcao>
        </Popup>
        <FormAcao acao={fecharObs} semMensagem>
          <Enviar variante="normal">Trancar a página</Enviar>
        </FormAcao>
      </div>
    </section>
  );
}

export function ObsView({ liga }: { liga: EstadoLiga }) {
  return (
    <>
      <LigaNaLive liga={liga} />
      <Cabeca titulo="Cenas do OBS" descricao="Todas as suas cenas hospedadas no site. Mudou aqui, muda no OBS: é só atualizar a fonte." />
      <Secao titulo="Como colocar no OBS">
        <ol className="obs-passos">
          <li>Na cena, <b>Fontes</b> &gt; <b>+</b> &gt; <b>Navegador</b>. Se a fonte já existe, abra as <b>Propriedades</b> dela.</li>
          <li><b>Desmarque</b> &quot;Arquivo local&quot; e cole o link no campo <b>URL</b>.</li>
          <li>Largura <b>1920</b>, altura <b>1080</b>. Marque &quot;Desligar a fonte quando não estiver visível&quot; e &quot;Atualizar o navegador quando a cena se tornar ativa&quot;.</li>
          <li>Ctrl+E: posição <b>0, 0</b>, escala <b>1</b>. Tamanho só nas propriedades, nunca arrastando.</li>
          <li>Webcam: na posição indicada em cada cena, com 422 × 234 no gameplay e &quot;Escalonar para os limites externos&quot;.</li>
        </ol>
      </Secao>
      <Secao titulo="Cenas da live"><Lista cenas={CENAS_DA_LIVE} /></Secao>
      <Secao titulo="Gameplay" dica="A webcam é a mesma fonte em todas (Adicionar existente), só muda a posição em cada cena."><Lista cenas={GAMEPLAY} /></Secao>
      <Secao titulo="Liga (peças avulsas)" dica="As cenas acima já trazem a liga. Estas são para usos à parte."><Lista cenas={LIGA} /></Secao>
      <Secao titulo="Para testar"><Lista cenas={TESTE} /></Secao>
    </>
  );
}
