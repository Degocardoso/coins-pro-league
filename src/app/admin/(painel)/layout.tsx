import "../fontes";
import type { ReactNode } from "react";
import { exigirAdmin } from "@/controllers/sessao";
import { TemporadaController } from "@/controllers/TemporadaController";
import { PainelController } from "@/controllers/PainelController";
import { AvisosProvider } from "@/views/comum/Avisos";
import { getDb } from "@/models/db";
import { Moldura } from "@/views/admin/telas/Moldura";

export const metadata = { title: "Painel | Coin's Pro League", robots: { index: false } };

export default async function Layout({ children }: { children: ReactNode }) {
  const admin = await exigirAdmin();
  const [temporada, pendentes] = await Promise.all([
    new TemporadaController(getDb()).ativa(),
    new PainelController(getDb()).contarPendentes(),
  ]);
  return (
    <Moldura nome={admin.nome} temporada={temporada?.nome ?? null} pendentes={pendentes}>
      <AvisosProvider>
      {children}
    </AvisosProvider>
    </Moldura>
  );
}
