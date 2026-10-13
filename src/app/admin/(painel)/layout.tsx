import "../fontes";
import type { ReactNode } from "react";
import { exigirAdmin } from "@/controllers/sessao";
import { TemporadaController } from "@/controllers/TemporadaController";
import { getDb } from "@/models/db";
import { Moldura } from "@/views/admin/telas/Moldura";

export const metadata = { title: "Painel | Coin's Pro League", robots: { index: false } };

export default async function Layout({ children }: { children: ReactNode }) {
  const admin = await exigirAdmin();
  const temporada = await new TemporadaController(getDb()).ativa();
  return (
    <Moldura nome={admin.nome} temporada={temporada?.nome ?? null}>
      {children}
    </Moldura>
  );
}
