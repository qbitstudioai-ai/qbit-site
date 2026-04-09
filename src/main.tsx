import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SiteSettingsProvider } from "./siteSettings/SiteSettingsContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  </StrictMode>,
);
