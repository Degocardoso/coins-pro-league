import "./globais.css";
import { cookies } from "next/headers";

// Endereço público do site, usado nos links de compartilhamento (imagem e título no X e no Discord).
// Na Vercel, vem sozinho; com domínio próprio, defina SITE_URL.
const SITE =
  process.env.SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata = { title: "Coin's Pro League", metadataBase: new URL(SITE) };

// Sem escolha salva, segue o tema do sistema. Roda antes da página aparecer, então não pisca.
const SCRIPT_TEMA = `(function(){try{var d=document.documentElement;if(!d.dataset.tema){d.dataset.tema=matchMedia('(prefers-color-scheme: light)').matches?'claro':'escuro'}}catch(e){}})()`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const salvo = (await cookies()).get("cpl_tema")?.value;
  const tema = salvo === "claro" || salvo === "escuro" ? salvo : undefined;
  return (
    <html lang="pt-BR" data-tema={tema} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
