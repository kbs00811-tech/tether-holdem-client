import { createBrowserRouter } from "react-router";
import Root from "./pages/Root";
import Lobby from "./pages/Lobby";
import GameTable from "./pages/GameTable";
import TournamentLobby from "./pages/TournamentLobby";
import TournamentTable from "./pages/TournamentTable";
import Profile from "./pages/Profile";
import Cashier from "./pages/Cashier";
import AssetShowcase from "./pages/AssetShowcase";
import AdminDashboard from "./pages/AdminDashboard";
import PricingPage from "./pages/PricingPage";
import SignupB2B from "./pages/SignupB2B";
import GameManual from "./pages/GameManual";
import TournamentManual from "./pages/TournamentManual";
// 🚨 fix(2026-04-27): Leaderboard/Missions/HandHistory 페이지 파일이 이 태그(backup-pre-i18n-20260426)
// 에 존재하지 않음 — i18n WIP 커밋에서 추가됐다가 롤백되며 import 만 잔존. 빌드 차단으로 제거.

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Lobby },
      { path: "lobby", Component: Lobby },
      // V22 Phase 2+: B2B iframe 임베드 경로 — 문서 §3 iframe src 일치
      //   실제 동작은 Lobby 와 동일 (useEmbedMode 가 URL ?tenant, ?token 파싱)
      { path: "embed", Component: Lobby },
      { path: "table/:tableId", Component: GameTable },
      { path: "tournaments", Component: TournamentLobby },
      { path: "tournament/:tournamentId", Component: TournamentTable },
      { path: "profile", Component: Profile },
      { path: "cashier", Component: Cashier },
      { path: "assets", Component: AssetShowcase },
      { path: "admin", Component: AdminDashboard },
      { path: "pricing", Component: PricingPage },
      { path: "signup", Component: SignupB2B },
      { path: "game-manual", Component: GameManual },
      { path: "tournament-manual", Component: TournamentManual },
    ],
  },
]);