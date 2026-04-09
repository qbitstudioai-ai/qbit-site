import { getSupabaseClient } from "./supabaseClient";

export async function fetchSiteCopyPayloadFromDb(): Promise<Record<string, unknown> | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb
    .schema("qbit_site")
    .from("site_copy")
    .select("payload")
    .eq("id", 1)
    .maybeSingle();
  if (error) {
    console.warn("[qbit] site_copy", error);
    return null;
  }
  const p = data?.payload;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    return p as Record<string, unknown>;
  }
  return null;
}

function translateError(code?: string, detail?: string): string {
  switch (code) {
    case "forbidden":
      return "Доступ запрещён: проверьте пароль и QBIT_ADMIN_UPLOAD_PASSWORD на сервере.";
    case "too_large":
      return "Тексты слишком большие для сохранения на сервере.";
    case "validation":
    case "json":
      return "Некорректные данные для сохранения.";
    case "db":
      return `Ошибка БД: ${detail ?? ""}`.trim();
    default:
      return detail ?? code ?? "Ошибка сохранения текстов";
  }
}

export async function callSaveSiteCopy(payload: Record<string, unknown>): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const password = import.meta.env.VITE_ADMIN_PASSWORD?.trim();
  if (!url || !anon || !password) {
    throw new Error(
      "Задайте VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY и VITE_ADMIN_PASSWORD для сохранения на сервер.",
    );
  }
  const res = await fetch(`${url}/functions/v1/save-site-copy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "Content-Type": "application/json",
      "x-qbit-admin-password": password,
    },
    body: JSON.stringify({ payload }),
  });
  let j: { ok?: boolean; error?: string; detail?: string };
  try {
    j = (await res.json()) as typeof j;
  } catch {
    throw new Error(`Ответ сервера: ${res.status}`);
  }
  if (!res.ok || !j.ok) {
    throw new Error(translateError(j.error, j.detail));
  }
}
