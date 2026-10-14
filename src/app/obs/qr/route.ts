// QR code da inscrição de uma competição (SVG). ?c=ID; ?baixar=1 para salvar o arquivo.
import { gerarQrSvg, origemPublica } from "@/lib/qr";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const c = Number(params.get("c"));
  if (!Number.isInteger(c) || c < 1) return new Response("Competição inválida", { status: 400 });
  const svg = await gerarQrSvg(`${origemPublica(req)}/i/${c}`);
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Robots-Tag": "noindex",
      // Sem nome no cabeçalho: o botão do admin define o nome do arquivo (com o nome da competição)
      ...(params.get("baixar") ? { "Content-Disposition": "attachment" } : {}),
    },
  });
}
