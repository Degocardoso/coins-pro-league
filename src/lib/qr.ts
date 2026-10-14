// QR code em SVG com a moeda da marca no centro. Correção de erro Q (recupera 25%): a moeda ocupa ~3% da área,
// e o QR fica com menos quadradinhos (maiores) do que no nível H, mais fácil de ler pela transmissão.
import QRCode from "qrcode";

export async function gerarQrSvg(texto: string): Promise<string> {
  const svg = await QRCode.toString(texto, {
    type: "svg",
    errorCorrectionLevel: "Q",
    margin: 2,
    color: { dark: "#0b1019", light: "#ffffff" },
  });
  const tamanho = Number(/viewBox="0 0 (\d+) \d+"/.exec(svg)?.[1] ?? 0);
  if (!tamanho) return svg;
  // Moeda no centro: 18% da largura, com borda branca para separar dos quadradinhos
  const c = tamanho / 2;
  const r = tamanho * 0.09;
  const moeda = `<g><circle cx="${c}" cy="${c}" r="${r + 0.9}" fill="#ffffff"/><circle cx="${c}" cy="${c}" r="${r}" fill="#f5b53c"/><circle cx="${c}" cy="${c}" r="${r * 0.68}" fill="none" stroke="#c8861c" stroke-width="${r * 0.16}"/><rect x="${c - r * 0.09}" y="${c - r * 0.5}" width="${r * 0.18}" height="${r}" fill="#c8861c"/></g>`;
  return svg.replace(/<\/svg>\s*$/, `${moeda}</svg>`);
}

/** Endereço público do site: SITE_URL (domínio próprio) ou o endereço de onde veio o pedido. */
export function origemPublica(req: Request) {
  return (process.env.SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");
}
