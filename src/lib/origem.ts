// Endereço público do site numa página do servidor: SITE_URL (domínio próprio) ou o endereço do pedido
import "server-only";
import { headers } from "next/headers";

export async function origemDoSite() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return `${h.get("x-forwarded-proto") ?? (local ? "http" : "https")}://${host}`;
}
