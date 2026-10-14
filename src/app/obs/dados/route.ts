// Dados das telas do OBS em JSON. Sem cache: resultado lançado no admin aparece na próxima leitura (20 s).
import { getDb } from "@/models/db";
import { ObsController } from "@/controllers/ObsController";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const c = Number(new URL(req.url).searchParams.get("c")) || null;
  const dados = await new ObsController(getDb()).dados(c);
  return Response.json(dados, {
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
