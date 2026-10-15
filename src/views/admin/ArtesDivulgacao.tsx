// VIEW — artes e textos de divulgação gerados da ficha da competição
import { FORMATOS, type Formato } from "@/views/divulgacao/Arte";
import { CopiarTexto } from "./CopiarTexto";

type Textos = { whatsapp: string; instagram: string; x: string };
type Convites = { chat: string; link: string; dm: string } | null;

export function ArtesDivulgacao({ competicaoId, textos, convites, versao }: { competicaoId: number; textos: Textos; convites: Convites; versao: number }) {
  const formatos = Object.entries(FORMATOS) as [Formato, (typeof FORMATOS)[Formato]][];
  return (
    <>
      <div className="artes">
        {formatos.map(([chave, f]) => (
          <figure key={chave} className="arte">
            <a href={`/divulgacao/${competicaoId}/${chave}?v=${versao}`} target="_blank" rel="noopener noreferrer" className="arte-previa" style={{ aspectRatio: `${f.largura} / ${f.altura}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/divulgacao/${competicaoId}/${chave}?v=${versao}`} alt={`Arte para ${f.nome}`} loading="lazy" width={f.largura} height={f.altura} />
            </a>
            <figcaption>
              <strong>{f.nome}</strong>
              <span>{f.largura} × {f.altura}</span>
              <a className="btn btn-mini" href={`/divulgacao/${competicaoId}/${chave}?baixar=1&v=${versao}`} download>Baixar</a>
            </figcaption>
          </figure>
        ))}
      </div>
      <div className="textos-divulgacao">
        <CopiarTexto rotulo="WhatsApp" texto={textos.whatsapp} />
        <CopiarTexto rotulo="Instagram (legenda)" texto={textos.instagram} />
        <CopiarTexto rotulo="X" texto={textos.x} />
      </div>

      <h3 className="subtitulo-divulgacao">Convite para outros streamers</h3>
      {convites ? (
        <>
          <p className="dica-imagem">
            Comece pela pergunta no chat, sem link: muitos canais bloqueiam links, e divulgação sem pedir costuma render ban. O link no chat é só depois
            que o streamer ou um mod liberar. A DM (sussurro da Twitch ou Discord do canal) é o caminho mais seguro.
          </p>
          <div className="textos-divulgacao">
            <CopiarTexto rotulo="1. Perguntar no chat" texto={convites.chat} />
            <CopiarTexto rotulo="2. Link no chat (com permissão)" texto={convites.link} />
            <CopiarTexto rotulo="3. DM pro streamer" texto={convites.dm} />
          </div>
        </>
      ) : (
        <p className="dica-imagem">Com a competição em andamento, não há convite para inscrever times. Os convites aparecem quando ela está em breve ou com inscrições abertas.</p>
      )}
    </>
  );
}
