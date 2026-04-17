import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { GameErrorBoundary } from "./components/GameErrorBoundary";

export default function App() {
  return (
    <GameErrorBoundary>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        closeButton
      />
    </GameErrorBoundary>
  );
}