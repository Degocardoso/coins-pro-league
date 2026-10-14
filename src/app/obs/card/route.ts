// Tela do OBS: HTML puro (ver src/views/obs/card.ts)
import { respostaHtml } from "@/views/obs/base";
import { telaCard } from "@/views/obs/card";

export function GET() {
  return respostaHtml(telaCard());
}
