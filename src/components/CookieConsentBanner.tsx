import { useCallback, useId, useState } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

const STORAGE_KEY = "qbit_cookie_consent";

function readAccepted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

export function CookieConsentBanner() {
  const titleId = useId();
  const [dismissed, setDismissed] = useState(readAccepted);
  const { privacyPolicyLinkEnabled, privacyPolicyHref } = useSiteSettings();
  const { cookieConsent } = useSiteContent();

  const accept = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* storage недоступен — просто скрываем баннер в сессии */
    }
    setDismissed(true);
  }, []);

  if (dismissed) return null;

  return (
    <div
      className="cookie-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="layout cookie-consent__inner">
        <p id={titleId} className="cookie-consent__text">
          {privacyPolicyLinkEnabled ? (
            <>
              {cookieConsent.textBefore}{" "}
              <a
                className="cookie-consent__policy-link"
                href={privacyPolicyHref}
                target="_blank"
                rel="noreferrer"
              >
                {cookieConsent.privacyPolicyLabel}
              </a>
              {cookieConsent.textAfter}
            </>
          ) : (
            cookieConsent.textWithoutPolicyLink
          )}
        </p>
        <button type="button" className="cookie-consent__accept" onClick={accept}>
          {cookieConsent.acceptLabel}
        </button>
      </div>
    </div>
  );
}
