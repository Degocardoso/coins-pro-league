// VIEW — links das telas do OBS, prontos para copiar
import { CopiarLink } from "../CopiarLink";
import { Cabeca, Secao } from "../componentes";

const CENAS = [
  { cena: "01a", onde: "câmera em cima à direita: o card entra embaixo à esquerda" },
  { cena: "01b", onde: "câmera em cima à esquerda: o card entra embaixo à direita" },
  { cena: "01c", onde: "câmera embaixo à direita: o card entra embaixo à esquerda" },
  { cena: "01d", onde: "câmera embaixo à esquerda: o card entra embaixo à direita" },
];

export function ObsView() {
  return (
    <>
      <Cabeca
        titulo="Telas do OBS"
        descricao="Em todas: fonte de Navegador, largura 1920, altura 1080, posição 0/0, escala 1. Os dados se atualizam sozinhos a cada 30 segundos."
      />
      <Secao titulo="Rodapé de resultados" dica="Para Just Chatting, pausa e abertura. Faixa na base da tela, abaixo da webcam e do chat.">
        <CopiarLink caminho="/obs/rodape" rotulo="Rodapé" />
      </Secao>
      <Secao
        titulo="Card do gameplay"
        dica="Um link por cena de gameplay. O card aparece 1 minuto depois de a cena abrir e depois a cada 10 minutos, por 12 segundos. Para mudar, acrescente no fim do link, por exemplo, &a_cada=15&duracao=10."
      >
        {CENAS.map((c) => (
          <CopiarLink key={c.cena} caminho={`/obs/card?cena=${c.cena}`} rotulo={`Cena ${c.cena} (${c.onde})`} />
        ))}
      </Secao>
      <Secao titulo="Campeão" dica="Cena inteira. Mostra o banner da ficha e o campeão quando a competição estiver como Encerrada.">
        <CopiarLink caminho="/obs/campeao" rotulo="Campeão" />
      </Secao>
      <Secao
        titulo="Para posicionar antes da liga começar"
        dica="Versões com dados de exemplo. O card de teste aparece em 2 segundos e repete a cada 20. Depois de posicionar, troque pelo link normal."
      >
        <CopiarLink caminho="/obs/rodape?teste=1" rotulo="Rodapé de teste" />
        <CopiarLink caminho="/obs/card?cena=01a&teste=1" rotulo="Card de teste (cena 01a)" />
        <CopiarLink caminho="/obs/campeao?teste=1" rotulo="Campeão de teste" />
      </Secao>
    </>
  );
}
