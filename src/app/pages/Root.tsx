import { Outlet, useLocation } from "react-router";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { ConnectionStatus } from "../components/ConnectionStatus";

export default function Root() {
  const location = useLocation();
  const isGameTable = location.pathname.startsWith("/table/") || location.pathname.startsWith("/tournament/");

  if (isGameTable) {
    return (
      <div className="h-screen dark">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E14] dark">
      <Header />
      <ConnectionStatus />
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
