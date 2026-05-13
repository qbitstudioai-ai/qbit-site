import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { SiteSettingsProvider } from "./siteSettings/SiteSettingsContext";
import { isAdminHash } from "./useHashAdmin";

const rootEl = document.getElementById("root")!;
const tree = (
  <StrictMode>
    <SiteSettingsProvider>
      <App />
    </SiteSettingsProvider>
  </StrictMode>
);

if (isAdminHash()) {
  rootEl.innerHTML = "";
  createRoot(rootEl).render(tree);
} else {
  hydrateRoot(rootEl, tree);
}
