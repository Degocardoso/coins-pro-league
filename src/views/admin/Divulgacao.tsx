"use client";
// VIEW — divulgação da inscrição: link curto, QR code e download em PNG (posts) ou SVG (impressão)
import { useState } from "react";
import { CopiarLink } from "./CopiarLink";

export function Divulgacao({ competicaoId, nome }: { competicaoId: number; nome: string }) {
  const qr = `/obs/qr?c=${competicaoId}`;
  const [gerando, setGerando] = useState(false);
  const arquivo = `qr-inscricao-${nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

  // Desenha o QR (SVG) num quadro de 1080 × 1080 e baixa como PNG, que serve para Instagram e Discord
  async function baixarPng() {
    setGerando(true);
    try {
      const img = new Image();
      img.src = qr;
      await img.decode();
      const lado = 1080;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = lado;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, lado, lado);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, lado, lado);
      const link = document.createElement("a");
      link.download = `${arquivo}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setGerando(false);
    }
  }

  return (
    <div className="divulgacao">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr} alt={`QR code da inscrição da ${nome}`} width={168} height={168} />
      <div>
        <CopiarLink caminho={`/i/${competicaoId}`} rotulo="Link curto de inscrição desta competição (já abre com ela escolhida)" />
        <p className="dica-imagem">
          O QR code leva para o mesmo link. Na live, ele aparece sozinho no rodapé e no card do gameplay enquanto as inscrições estiverem abertas.
        </p>
        <div className="linha-form">
          <button type="button" className="btn btn-ouro" onClick={baixarPng} disabled={gerando}>
            {gerando ? "Gerando…" : "Baixar QR code (PNG)"}
          </button>
          <a className="btn" href={`${qr}&baixar=1`} download={`${arquivo}.svg`}>Baixar em SVG</a>
        </div>
      </div>
    </div>
  );
}
