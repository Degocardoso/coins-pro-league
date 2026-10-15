import "@fontsource-variable/inter";
import { AvisosProvider } from "@/views/comum/Avisos";
import "@fontsource-variable/newsreader/opsz.css";
import "@/views/site/site.css";
import type { ReactNode } from "react";
import { MolduraSite } from "@/views/site/Moldura";

export const metadata = {
  title: { default: "Coin's Pro League", template: "%s | Coin's Pro League" },
  description: "Liga de Pro Clubs do EA SPORTS FC 27 da comunidade thecoinsquash: tabela, rankings, regulamento e inscrições.",
  // Imagem que aparece ao colar o link no WhatsApp, X, Discord etc.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Coin's Pro League",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Coin's Pro League: liga de Pro Clubs do EA SPORTS FC 27" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <MolduraSite>
      <AvisosProvider>{children}</AvisosProvider>
    </MolduraSite>
  );
}
