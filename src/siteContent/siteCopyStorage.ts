const LS_COPY_KEY = "qbit_site_copy_payload_v1";

export function loadLocalSiteCopyPayload(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(LS_COPY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function saveLocalSiteCopyPayload(payload: Record<string, unknown>): void {
  try {
    localStorage.setItem(LS_COPY_KEY, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}
