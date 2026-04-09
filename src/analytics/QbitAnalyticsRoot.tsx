import { useEffect } from "react";
import {
  beginPageView,
  flushPageView,
  initQbitSiteAnalytics,
} from "./qbitAnalytics";

/** Вешает аналитику только на публичную часть сайта (не #admin). */
export function QbitAnalyticsRoot() {
  useEffect(() => {
    const path = `${window.location.pathname}${window.location.search}`;
    void (async () => {
      const ok = await initQbitSiteAnalytics();
      if (ok) await beginPageView(path);
    })();

    const onHidden = () => {
      if (document.visibilityState === "hidden") void flushPageView();
    };
    const onPageHide = () => {
      void flushPageView();
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      void flushPageView();
    };
  }, []);

  return null;
}
