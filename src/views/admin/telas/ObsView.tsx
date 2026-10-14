// VIEW — todas as cenas do OBS hospedadas no site, organizadas por categoria, com o link pronto para copiar
import { CopiarLink } from "../CopiarLink";
import { Cabeca, Secao } from "../componentes";

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

export function ObsView() {
  return (
    <>
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
