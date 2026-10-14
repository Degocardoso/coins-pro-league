// Link curto de divulgação: /i/2 leva para a inscrição da competição 2 (QR code mais simples de ler)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const destino = Number.isInteger(id) && id > 0 ? `/inscricao?c=${id}` : "/inscricao";
  return Response.redirect(new URL(destino, req.url), 307);
}
