// Tela do OBS: HTML puro (ver src/views/obs/campeao.ts)
import { respostaHtml } from "@/views/obs/base";
import { telaCampeao } from "@/views/obs/campeao";

export function GET() {
  return respostaHtml(telaCampeao());
}
