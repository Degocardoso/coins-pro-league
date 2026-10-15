import { exigirAdmin } from "@/controllers/sessao";
import { SemAcessoView } from "@/views/admin/telas/SemAcessoView";

export default async function Pagina({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  await exigirAdmin();
  return <SemAcessoView area={(await searchParams).area ?? null} />;
}
