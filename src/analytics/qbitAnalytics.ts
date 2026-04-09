import { getSupabaseClient } from "../lib/supabaseClient";

const LS_VISITOR = "qbit_site_analytics_vid";
const SS_SESSION = "qbit_site_analytics_sid";
const SS_UTM = "qbit_site_utm_json";

type Utm = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
};

type AnalyticsState = {
  sb: NonNullable<ReturnType<typeof getSupabaseClient>>;
  visitorId: string;
  sessionId: string;
};

let state: AnalyticsState | null = null;
let initPromise: Promise<boolean> | null = null;

let openPageView: { id: string; enteredMs: number } | null = null;

function randomUuid(): string {
  return crypto.randomUUID();
}

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(LS_VISITOR);
    if (existing) return existing;
    const id = randomUuid();
    localStorage.setItem(LS_VISITOR, id);
    return id;
  } catch {
    return randomUuid();
  }
}

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SS_SESSION);
    if (existing) return existing;
    const id = randomUuid();
    sessionStorage.setItem(SS_SESSION, id);
    return id;
  } catch {
    return randomUuid();
  }
}

function captureUtmOnce(): Utm | null {
  try {
    const cached = sessionStorage.getItem(SS_UTM);
    if (cached) return JSON.parse(cached) as Utm;
    const p = new URLSearchParams(window.location.search);
    const utm: Utm = {
      utm_source: p.get("utm_source") || null,
      utm_medium: p.get("utm_medium") || null,
      utm_campaign: p.get("utm_campaign") || null,
      utm_term: p.get("utm_term") || null,
      utm_content: p.get("utm_content") || null,
    };
    sessionStorage.setItem(SS_UTM, JSON.stringify(utm));
    return utm;
  } catch {
    return null;
  }
}

/**
 * Инициализация: visitor (upsert) + session (insert или update last_activity).
 * Без SELECT: id строк задаёт клиент (UUID в localStorage / sessionStorage).
 */
export async function initQbitSiteAnalytics(): Promise<boolean> {
  if (state) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const sb = getSupabaseClient();
    if (!sb) return false;

    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const utm = captureUtmOnce();
    const now = new Date().toISOString();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;

    const { error: vErr } = await sb
      .schema("qbit_site")
      .from("visitors")
      .upsert(
        {
          id: visitorId,
          anonymous_id: visitorId,
          updated_at: now,
        },
        { onConflict: "anonymous_id" },
      );

    if (vErr) {
      console.warn("[qbit analytics] visitor", vErr);
      initPromise = null;
      return false;
    }

    const { error: sErr } = await sb.rpc("qbit_site_upsert_session", {
      p_session_row_id: sessionId,
      p_visitor_row_id: visitorId,
      p_session_key: sessionId,
      p_started_at: now,
      p_last_activity_at: now,
      p_client_timezone: tz,
      p_referrer: document.referrer || null,
      p_utm_source: utm?.utm_source ?? null,
      p_utm_medium: utm?.utm_medium ?? null,
      p_utm_campaign: utm?.utm_campaign ?? null,
      p_utm_term: utm?.utm_term ?? null,
      p_utm_content: utm?.utm_content ?? null,
    });

    if (sErr) {
      console.warn("[qbit analytics] session rpc", sErr);
      initPromise = null;
      return false;
    }

    state = { sb, visitorId, sessionId };
    return true;
  })();

  return initPromise;
}

async function flushPageViewInternal(): Promise<void> {
  if (!state || !openPageView) return;
  const nowMs = Date.now();
  const leftIso = new Date(nowMs).toISOString();
  const duration_seconds = Math.max(
    0,
    Math.floor((nowMs - openPageView.enteredMs) / 1000),
  );
  const { error } = await state.sb
    .schema("qbit_site")
    .from("page_views")
    .update({ left_at: leftIso, duration_seconds })
    .eq("id", openPageView.id);
  if (error) console.warn("[qbit analytics] page_view close", error);
  openPageView = null;
}

/** Зафиксировать текущий path как просмотр (закрывает предыдущий, если был). */
export async function beginPageView(path?: string): Promise<void> {
  if (!(await initQbitSiteAnalytics()) || !state) return;

  await flushPageViewInternal();

  const p = path ?? (window.location.pathname || "/");
  const id = randomUuid();
  const enteredMs = Date.now();
  const entered_at = new Date(enteredMs).toISOString();

  const { error } = await state.sb.schema("qbit_site").from("page_views").insert({
    id,
    session_id: state.sessionId,
    path: p,
    entered_at,
  });

  if (error) {
    console.warn("[qbit analytics] page_view insert", error);
    return;
  }
  openPageView = { id, enteredMs };
}

export async function flushPageView(): Promise<void> {
  await flushPageViewInternal();
}

export async function trackQbitEvent(
  event_name: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  if (!(await initQbitSiteAnalytics()) || !state) return;
  const { error } = await state.sb.schema("qbit_site").from("events").insert({
    id: randomUuid(),
    session_id: state.sessionId,
    event_name,
    payload: payload ?? {},
    occurred_at: new Date().toISOString(),
  });
  if (error) console.warn("[qbit analytics] event", error);
}
