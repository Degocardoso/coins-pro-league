// Serve as imagens enviadas no admin. Cache longo: cada envio gera um id novo.
import { getDb } from "@/models/db";
import { ArquivoController } from "@/controllers/ArquivoController";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Não encontrado", { status: 404 });
  const arquivo = await new ArquivoController(getDb()).buscar(id);
  if (!arquivo) return new Response("Não encontrado", { status: 404 });
  return new Response(new Uint8Array(arquivo.bytes), {
    headers: {
      "Content-Type": arquivo.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
