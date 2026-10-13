import "../fontes";
import { LoginView } from "@/views/admin/telas/LoginView";

export const metadata = { title: "Entrar | Coin's Pro League", robots: { index: false } };

export default function Pagina() {
  return <LoginView />;
}
