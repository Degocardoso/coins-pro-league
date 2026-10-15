// Arte de divulgação de uma competição em PNG: /divulgacao/2/feed (feed, story, x, og). ?baixar=1 para salvar.
// Gerada da ficha da competição: taxa, prêmio, prazo e situação das inscrições vêm de lá.
import { ImageResponse } from "next/og";
import { getDb } from "@/models/db";
import { DivulgacaoController } from "@/controllers/DivulgacaoController";
import { origemPublica } from "@/lib/qr";
import { Arte, FORMATOS, type Formato } from "@/views/divulgacao/Arte";

export const dynamic = "force-dynamic";

// Fontes lidas do próprio site uma vez por instância (o ImageResponse não aceita woff2)
let fontes: Promise<{ name: string; data: ArrayBuffer; weight: 600 | 800 | 900; style: "normal" }[]> | null = null;
const carregarFontes = (origem: string) =>
  (fontes ??= Promise.all(
    ([600, 800, 900] as const).map(async (weight) => ({
      name: "Inter",
      weight,
      style: "normal" as const,
      data: await fetch(`${origem}/fontes/inter-${weight}.woff`).then((r) => {
        if (!r.ok) throw new Error(`fonte ${weight}: ${r.status}`);
        return r.arrayBuffer();
      }),
    })),
  ).catch((e) => {
    fontes = null; // tenta de novo no próximo pedido
    throw e;
  }));

export async function GET(req: Request, { params }: { params: Promise<{ id: string; formato: string }> }) {
  const { id, formato } = await params;
  if (!(formato in FORMATOS)) return new Response("Formato inválido (use feed, story, x ou og)", { status: 400 });
  const competicaoId = Number(id);
  if (!Number.isInteger(competicaoId) || competicaoId < 1) return new Response("Competição inválida", { status: 400 });
  const proprio = new URL(req.url).origin; // fontes e imagens vêm deste mesmo deploy
  const dados = await new DivulgacaoController(getDb()).dados(competicaoId, origemPublica(req));
  if (!dados) return new Response("Competição não encontrada", { status: 404 });
  const f = FORMATOS[formato as Formato];
  const baixar = new URL(req.url).searchParams.get("baixar");
  const arquivo = `${dados.competicao.nome.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${formato}-${f.largura}x${f.altura}.png`;
  return new ImageResponse(<Arte a={dados.conteudo} formato={formato as Formato} origem={proprio} />, {
    width: f.largura,
    height: f.altura,
    fonts: await carregarFontes(proprio),
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=3600",
      "X-Robots-Tag": "noindex",
      ...(baixar ? { "Content-Disposition": `attachment; filename="${arquivo}"` } : {}),
    },
  });
}
