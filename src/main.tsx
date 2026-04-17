
  import * as Sentry from "@sentry/react";
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  Sentry.init({
    dsn: "https://6e5b4f70d948b0cf32f799be09b2ca13@o4511229922508800.ingest.de.sentry.io/4511235551199312",
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });

  createRoot(document.getElementById("root")!).render(<App />);
  