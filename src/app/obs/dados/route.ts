// Dados das telas do OBS em JSON. Cache curto na Vercel: muitos acessos viram uma consulta a cada 20 s.
import { getDb } from "@/models/db";
import { ObsController } from "@/controllers/ObsController";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const c = Number(new URL(req.url).searchParams.get("c")) || null;
  const dados = await new ObsController(getDb()).dados(c);
  return Response.json(dados, {
    headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60", "X-Robots-Tag": "noindex" },
  });
}
