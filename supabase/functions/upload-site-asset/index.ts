/**
 * Загрузка / удаление презентации и политики в Supabase Storage (видят все пользователи).
 *
 * Env в контейнере functions:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (стандартные)
 *   QBIT_ADMIN_UPLOAD_PASSWORD — тот же пароль, что VITE_ADMIN_PASSWORD у фронта
 *
 * POST multipart: kind=presentation|privacy_policy, file=<binary>
 * Headers: Authorization + apikey (anon), x-qbit-admin-password: <пароль>
 *
 * POST JSON: { "action": "delete", "kind": "presentation" | "privacy_policy" }
 *
 * verify_jwt = false (см. config.toml); защита паролем в заголовке.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BUCKET = "qbit_site_files";
const MAX_BYTES = 50 * 1024 * 1024;

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

type Kind = "presentation" | "privacy_policy";

/** Имя ключа в Storage + корректный Content-Type (важно: у .html часто пустой file.type → иначе отдаётся как PDF и браузер показывает «код»). */
function presentationTarget(): { path: string; contentType: string } {
  return { path: "presentation.pdf", contentType: "application/pdf" };
}

function privacyPolicyTarget(file: File, mime: string): { path: string; contentType: string } {
  const lower = file.name.toLowerCase();
  const looksHtml =
    lower.endsWith(".html") || lower.endsWith(".htm") || mime.includes("html");
  if (looksHtml) {
    // Только "text/html": в bucket qbit_site_files allowed_mime_types не включает вариант с charset
    return { path: "privacy-policy.html", contentType: "text/html" };
  }
  return { path: "privacy-policy.pdf", contentType: "application/pdf" };
}

function allPrivacyPaths(): string[] {
  return ["privacy-policy.pdf", "privacy-policy.html"];
}

function checkPassword(req: Request): boolean {
  const expected = Deno.env.get("QBIT_ADMIN_UPLOAD_PASSWORD")?.trim();
  if (!expected) {
    console.error("upload-site-asset: QBIT_ADMIN_UPLOAD_PASSWORD not set");
    return false;
  }
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

  const admin = createClient(url, key);

  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    let body: { action?: string; kind?: string };
    try {
      body = (await req.json()) as { action?: string; kind?: string };
    } catch {
      return json({ ok: false, error: "json" }, 400);
    }
    if (body.action !== "delete") {
      return json({ ok: false, error: "validation" }, 400);
    }
    const kind = body.kind as Kind;
    if (kind !== "presentation" && kind !== "privacy_policy") {
      return json({ ok: false, error: "validation" }, 400);
    }

    if (kind === "presentation") {
      await admin.storage.from(BUCKET).remove(["presentation.pdf"]);
    } else {
      await admin.storage.from(BUCKET).remove(allPrivacyPaths());
    }

    await admin.schema("qbit_site").from("site_asset_versions").delete().eq("asset_key", kind);

    return json({ ok: true, deleted: kind });
  }

  if (!ct.includes("multipart/form-data")) {
    return json({ ok: false, error: "content_type" }, 400);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: "form" }, 400);
  }

  const kindRaw = form.get("kind");
  const file = form.get("file");
  if (typeof kindRaw !== "string" || !(file instanceof File)) {
    return json({ ok: false, error: "validation" }, 400);
  }

  const kind = kindRaw as Kind;
  if (kind !== "presentation" && kind !== "privacy_policy") {
    return json({ ok: false, error: "validation" }, 400);
  }

  const mime = file.type || "application/octet-stream";
  if (kind === "presentation") {
    if (!mime.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return json({ ok: false, error: "presentation_pdf_only" }, 400);
    }
  } else {
    const okMime =
      mime.includes("pdf") ||
      mime.includes("html") ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".html");
    if (!okMime) {
      return json({ ok: false, error: "privacy_pdf_or_html" }, 400);
    }
  }

  if (file.size > MAX_BYTES) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  const target =
    kind === "presentation" ? presentationTarget() : privacyPolicyTarget(file, mime);
  const path = target.path;
  const buf = new Uint8Array(await file.arrayBuffer());

  if (kind === "privacy_policy") {
    await admin.storage.from(BUCKET).remove(allPrivacyPaths());
  }

  const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buf, {
    contentType: target.contentType,
    upsert: true,
  });

  if (upErr) {
    console.error("upload-site-asset storage", upErr);
    return json({ ok: false, error: "storage", detail: upErr.message }, 502);
  }

  const updated_at = new Date().toISOString();
  const { error: dbErr } = await admin.schema("qbit_site").from("site_asset_versions").upsert(
    { asset_key: kind, updated_at, storage_path: path },
    { onConflict: "asset_key" },
  );

  if (dbErr) {
    console.error("upload-site-asset db", dbErr);
    return json({ ok: false, error: "db", detail: dbErr.message }, 502);
  }

  return json({
    ok: true,
    kind,
    path,
    updated_at,
  });
});
