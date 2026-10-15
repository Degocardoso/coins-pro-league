// VIEW — artes e textos de divulgação gerados da ficha da competição
import { FORMATOS, type Formato } from "@/views/divulgacao/Arte";
import { CopiarTexto } from "./CopiarTexto";

type Textos = { whatsapp: string; instagram: string; x: string };

export function ArtesDivulgacao({ competicaoId, textos, versao }: { competicaoId: number; textos: Textos; versao: number }) {
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
    </>
  );
}
