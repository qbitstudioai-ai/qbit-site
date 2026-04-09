/**
 * Сохранение JSON-оверлея текстов сайта (qbit_site.site_copy.payload).
 * Те же заголовки и пароль, что у upload-site-asset.
 *
 * POST JSON: { "payload": { ...частичное дерево как в коде... } }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const MAX_JSON_BYTES = 400_000;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-qbit-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function checkPassword(req: Request): boolean {
  const expected = Deno.env.get("QBIT_ADMIN_UPLOAD_PASSWORD")?.trim();
  if (!expected) return false;
  const got = req.headers.get("x-qbit-admin-password")?.trim();
  return got === expected;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method" }, 405);
  }
  if (!checkPassword(req)) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) {
    return json({ ok: false, error: "server_config" }, 500);
  }

  let body: { payload?: unknown };
  try {
    body = (await req.json()) as { payload?: unknown };
  } catch {
    return json({ ok: false, error: "json" }, 400);
  }

  const payload = body.payload;
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return json({ ok: false, error: "validation" }, 400);
  }

  const raw = JSON.stringify(payload);
  if (raw.length > MAX_JSON_BYTES) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  const admin = createClient(url, key);
  const updated_at = new Date().toISOString();
  const { error } = await admin
    .schema("qbit_site")
    .from("site_copy")
    .upsert({ id: 1, payload, updated_at }, { onConflict: "id" });

  if (error) {
    console.error("save-site-copy", error);
    return json({ ok: false, error: "db", detail: error.message }, 502);
  }

  return json({ ok: true, updated_at });
});
