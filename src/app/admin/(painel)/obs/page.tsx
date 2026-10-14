import { exigirAdmin } from "@/controllers/sessao";
import { ObsView } from "@/views/admin/telas/ObsView";

export default async function Pagina() {
  await exigirAdmin();
  return <ObsView />;
}
