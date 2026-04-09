import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

/** Тексты лендинга (дефолты из кода + правки из админки / Supabase). */
export function useSiteContent() {
  return useSiteSettings().siteCopy;
}
