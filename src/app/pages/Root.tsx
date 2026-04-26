import { Outlet, useLocation } from "react-router";
import { Header } from "../components/Header";
import { BottomNav } from "../components/BottomNav";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useEmbedMode } from "../hooks/useEmbedMode";
import { checkGeo, isGeoOverridden } from "../utils/geoGuard";
import GeoBlocked from "./GeoBlocked";

export default function Root() {
  const location = useLocation();
  const isGameTable = location.pathname.startsWith("/table/") || location.pathname.startsWith("/tournament/");
  const { isEmbedded } = useEmbedMode();

  // Beta-G Day 2-3 (2026-04-26): Geo guard
  //   - hard_blocked → 안내 페이지 (Terms/Privacy 만 접근 가능)
  //   - soft_warn / allowed → 정상 진입
  //   - URL ?geoOverride=allow 로 우회 가능 (개발/QA)
  //   - iframe (B2C 임베드) 는 호스트가 이미 geo 처리했다고 가정 → skip
  const isLegalPage = location.pathname === "/terms" || location.pathname === "/privacy";
  if (!isEmbedded && !isLegalPage && !isGeoOverridden()) {
    const geo = checkGeo();
    if (geo.status === 'hard_blocked' && geo.country) {
      return <GeoBlocked country={geo.country} reason={geo.reason || ''} />;
    }
  }

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
