import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AiChatWidget } from "./components/AiChatWidget";
import { SiteSettingsProvider, useSiteSettings } from "./siteSettings/SiteSettingsContext";

function AutomationChatOnly() {
  const { ready, chatEnabled } = useSiteSettings();
  if (!ready || !chatEnabled) return null;
  return <AiChatWidget />;
}

const el = document.getElementById("ai-chat-root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <SiteSettingsProvider>
        <AutomationChatOnly />
      </SiteSettingsProvider>
    </StrictMode>,
  );
}
