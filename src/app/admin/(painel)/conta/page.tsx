import { exigirAdmin } from "@/controllers/sessao";
import { ContaView } from "@/views/admin/telas/ContaView";

export default async function Pagina() {
  const eu = await exigirAdmin();
  return <ContaView eu={{ nome: eu.nome, email: eu.email, dono: eu.dono, areas: eu.areas }} />;
}
