import "../fontes";
import type { ReactNode } from "react";
import { exigirAdmin } from "@/controllers/sessao";
import { TemporadaController } from "@/controllers/TemporadaController";
import { PainelController } from "@/controllers/PainelController";
import { podeAcessar } from "@/lib/acesso";
import { AvisosProvider } from "@/views/comum/Avisos";
import { getDb } from "@/models/db";
import { Moldura } from "@/views/admin/telas/Moldura";

export const metadata = { title: "Painel | Coin's Pro League", robots: { index: false } };

export default async function Layout({ children }: { children: ReactNode }) {
  const admin = await exigirAdmin();
  const [temporada, pendentes] = await Promise.all([
    new TemporadaController(getDb()).ativa(),
    // O contador de inscrições só aparece para quem cuida de competições
    podeAcessar(admin, "competicoes") ? new PainelController(getDb()).contarPendentes() : Promise.resolve(0),
  ]);
  return (
    <Moldura pessoa={{ nome: admin.nome, dono: admin.dono, areas: admin.areas }} temporada={temporada?.nome ?? null} pendentes={pendentes}>
      <AvisosProvider>{children}</AvisosProvider>
    </Moldura>
  );
}
