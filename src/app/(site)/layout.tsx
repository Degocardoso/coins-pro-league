import "@fontsource-variable/inter";
import "@fontsource-variable/newsreader/opsz.css";
import "@/views/site/site.css";
import type { ReactNode } from "react";
import { MolduraSite } from "@/views/site/Moldura";

export const metadata = {
  title: { default: "Coin's Pro League", template: "%s | Coin's Pro League" },
  description: "Liga de Pro Clubs do EA SPORTS FC 26 da comunidade thecoinsquash: tabela, rankings, regulamento e inscrições.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <MolduraSite>{children}</MolduraSite>;
}
