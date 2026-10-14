"use client";
// VIEW — campo de imagem com o tamanho ideal e a prévia recortada do jeito que aparece no site
import { useEffect, useState } from "react";

const LIMITE = 3 * 1024 * 1024;

export function CampoImagem({
  nome,
  rotulo,
  dica,
  atual,
  proporcao,
  ajuste = "cover",
}: {
  nome: string;
  rotulo: string;
  dica: string;
  atual?: string | null;
  proporcao: string; // ex.: "16 / 9" ou "1 / 1"
  ajuste?: "cover" | "contain";
}) {
  const [previa, setPrevia] = useState<string | null>(atual ?? null);
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => () => { if (previa?.startsWith("blob:")) URL.revokeObjectURL(previa); }, [previa]);

  return (
    <div className="campo campo-largo campo-imagem">
      <span>{rotulo}</span>
      <p className="dica-imagem">{dica}</p>
      <div className="previa-moldura" style={{ aspectRatio: proporcao, maxWidth: proporcao === "1 / 1" ? 160 : 420 }}>
        {previa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previa} alt="Prévia de como a imagem aparece no site" style={{ objectFit: ajuste }} />
        ) : (
          <span>Sem imagem</span>
        )}
      </div>
      <input
        type="file"
        name={nome}
        accept="image/png,image/jpeg,image/webp"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (!arquivo) return setPrevia(atual ?? null);
          setAviso(arquivo.size > LIMITE ? "Essa imagem passa de 3 MB e vai ser recusada. Diminua antes de enviar." : null);
          setPrevia(URL.createObjectURL(arquivo));
        }}
      />
      {aviso && <div className="msg msg-alerta">{aviso}</div>}
    </div>
  );
}
