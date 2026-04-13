import { Outlet, useLocation } from "react-router";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useEmbedMode } from "../hooks/useEmbedMode";

export default function Root() {
  const location = useLocation();
  const isGameTable = location.pathname.startsWith("/table/") || location.pathname.startsWith("/tournament/");
  const { isEmbedded } = useEmbedMode();

  if (isGameTable) {
    return (
      <div className="h-screen dark">
        <Outlet />
      </div>
    );
  }

  // Embed 모드 (B2C iframe 내부): 자체 헤더/바텀내비 숨김 — 호스트(B2C)가 레이아웃 관리
  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-[#0B0E14] dark">
        <ConnectionStatus />
        <main className="pb-4">
          <Outlet />
        </main>
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
