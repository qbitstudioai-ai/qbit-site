/**
 * Шаг 3: Edge Function — фиксация посетителя/сессии с IP и гео по IP.
 *
 * Вызов: POST + JSON-тело. Без проверки JWT (verify_jwt = false) — секрет не в теле,
 * пишем только аналитику; при спаме добавьте rate limit / секрет в заголовке.
 *
 * Переменные среды (подставляются Supabase): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Деплой (CLI): supabase functions deploy qbit-analytics-session --no-verify-jwt
 * Self-hosted: см. документацию образа; часто тот же флаг или аналог в конфиге.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type GeoResult = {
  country: string | null;
  region: string | null;
  city: string | null;
  raw: Record<string, unknown>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clientIpFromRequest(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf?.trim()) return cf.trim();
  const trueClient = req.headers.get("true-client-ip");
  if (trueClient?.trim()) return trueClient.trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return null;
}

function isNonPublicIp(ip: string): boolean {
  if (!ip) return true;
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower.startsWith("127.")) return true;
  if (lower.startsWith("10.")) return true;
  if (lower.startsWith("192.168.")) return true;
  if (lower.startsWith("172.")) {
    const parts = lower.split(".");
    const second = parseInt(parts[1] ?? "0", 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // IPv6 ULA
  return false;
}

async function lookupGeo(ip: string): Promise<GeoResult | null> {
  if (isNonPublicIp(ip)) return null;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    if (data.success !== true) return null;
    return {
      country: typeof data.country === "string" ? data.country : null,
      region: typeof data.region === "string" ? data.region : null,
      city: typeof data.city === "string" ? data.city : null,
      raw: data,
    };
  } catch {
    return null;
  }
}

type SessionBody = {
  anonymous_id?: string;
  session_key?: string;
  client_timezone?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  /** ISO 8601 — завершение сессии (уход / таймаут) */
  ended_at?: string | null;
};

const MAX_LEN = 2048;

function clip(s: string | null | undefined, max = MAX_LEN): string | null {
  if (s == null || s === "") return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let body: SessionBody;
  try {
    body = (await req.json()) as SessionBody;
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const anonymous_id = clip(body.anonymous_id, 128);
  const session_key = clip(body.session_key, 128);
  if (!anonymous_id || !session_key) {
    return jsonResponse(
      { error: "anonymous_id and session_key are required" },
      400,
    );
  }

  const clientIp = clientIpFromRequest(req);
  const geo = clientIp ? await lookupGeo(clientIp) : null;

  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = new Date().toISOString();

  const { data: visRow, error: vErr } = await admin
    .schema("qbit_site")
    .from("visitors")
    .upsert(
      { anonymous_id, updated_at: now },
      { onConflict: "anonymous_id" },
    )
    .select("id")
    .single();

  if (vErr || !visRow) {
    return jsonResponse({ error: vErr?.message ?? "visitor upsert" }, 500);
  }

  const visitorId = visRow.id as string;

  const { data: existingSession, error: sSelErr } = await admin
    .schema("qbit_site")
    .from("sessions")
    .select("id")
    .eq("session_key", session_key)
    .maybeSingle();

  if (sSelErr) {
    return jsonResponse({ error: sSelErr.message }, 500);
  }

  const ended_at = body.ended_at ? clip(body.ended_at, 64) : null;

  if (existingSession) {
    const update: Record<string, unknown> = {
      last_activity_at: now,
    };
    if (ended_at) update.ended_at = ended_at;
    if (clientIp) {
      update.ip_address = clientIp;
      if (geo) {
        update.country = geo.country;
        update.region = geo.region;
        update.city = geo.city;
        update.geo = geo.raw;
      }
    }

    const { error: sUpErr } = await admin
      .schema("qbit_site")
      .from("sessions")
      .update(update)
      .eq("id", existingSession.id);

    if (sUpErr) {
      return jsonResponse({ error: sUpErr.message }, 500);
    }
    return jsonResponse({
      ok: true,
      visitor_id: visitorId,
      session_id: existingSession.id,
      ip: clientIp,
      geo: geo
        ? { country: geo.country, region: geo.region, city: geo.city }
        : null,
    });
  }

  const insertRow = {
    visitor_id: visitorId,
    session_key,
    started_at: now,
    last_activity_at: now,
    ended_at: ended_at ?? null,
    client_timezone: clip(body.client_timezone, 128),
    referrer: clip(body.referrer),
    utm_source: clip(body.utm_source, 512),
    utm_medium: clip(body.utm_medium, 512),
    utm_campaign: clip(body.utm_campaign, 512),
    utm_term: clip(body.utm_term, 512),
    utm_content: clip(body.utm_content, 512),
    ip_address: clientIp ?? null,
    country: geo?.country ?? null,
    region: geo?.region ?? null,
    city: geo?.city ?? null,
    geo: (geo?.raw ?? {}) as Record<string, unknown>,
  };

  const { data: newSess, error: sInsErr } = await admin
    .schema("qbit_site")
    .from("sessions")
    .insert(insertRow)
    .select("id")
    .single();

  if (sInsErr || !newSess) {
    return jsonResponse({ error: sInsErr?.message ?? "session insert" }, 500);
  }

  return jsonResponse({
    ok: true,
    visitor_id: visitorId,
    session_id: newSess.id,
    ip: clientIp,
    geo: geo
      ? { country: geo.country, region: geo.region, city: geo.city }
      : null,
  });
});
