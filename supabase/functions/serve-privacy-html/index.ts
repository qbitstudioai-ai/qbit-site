/**
 * Публичная отдача privacy-policy.html с заголовками text/html + inline.
 * Прямой URL Storage у части конфигураций отдаёт файл как text/plain — браузер показывает «код».
 *
 * Self-hosted: скопировать папку в volumes/functions/serve-privacy-html и restart functions.
 * verify_jwt = false
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const BUCKET = "qbit_site_files";
const OBJECT = "privacy-policy.html";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: cors });
  }

  const url = Deno.env.get("SUPABASE_URL")?.trim();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!url || !key) {
    return new Response("Server misconfigured", { status: 500, headers: cors });
  }

  const admin = createClient(url, key);
  const { data, error } = await admin.storage.from(BUCKET).download(OBJECT);

  if (error || !data) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", ...cors },
    });
  }

  const buf = new Uint8Array(await data.arrayBuffer());
  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=120",
      ...cors,
    },
  });
});
