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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Lobby },
      { path: "lobby", Component: Lobby },        // B2C iframe 임베드용 명시적 alias
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