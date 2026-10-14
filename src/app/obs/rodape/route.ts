// Tela do OBS: HTML puro (ver src/views/obs/rodape.ts)
import { respostaHtml } from "@/views/obs/base";
import { telaRodape } from "@/views/obs/rodape";

export function GET() {
  return respostaHtml(telaRodape());
}
