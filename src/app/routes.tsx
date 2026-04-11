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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Lobby },
      { path: "table/:tableId", Component: GameTable },
      { path: "tournaments", Component: TournamentLobby },
      { path: "tournament/:tournamentId", Component: TournamentTable },
      { path: "profile", Component: Profile },
      { path: "cashier", Component: Cashier },
      { path: "assets", Component: AssetShowcase },
      { path: "admin", Component: AdminDashboard },
    ],
  },
]);