import { getSupabaseClient } from "./supabaseClient";

export type SiteAssetRow = {
  asset_key: string;
  updated_at: string;
  storage_path: string;
};

export function publicStorageObjectUrl(projectUrl: string, storagePath: string): string {
  const base = projectUrl.replace(/\/$/, "");
  const safePath = storagePath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  return `${base}/storage/v1/object/public/qbit_site_files/${safePath}`;
}

export function bustUrl(fileUrl: string, updatedAt: string): string {
  const u = new URL(fileUrl);
  u.searchParams.set("v", updatedAt);
  return u.toString();
}

export async function fetchSiteAssetRows(): Promise<SiteAssetRow[]> {
  const sb = getSupabaseClient();
  if (!sb) return [];
  const { data, error } = await sb
    .schema("qbit_site")
    .from("site_asset_versions")
    .select("asset_key,updated_at,storage_path");
  if (error) {
    console.warn("[qbit] site_asset_versions", error);
    return [];
  }
  return (data ?? []) as SiteAssetRow[];
}

function translateUploadError(code?: string, detail?: string): string {
  switch (code) {
    case "forbidden":
      return "Доступ запрещён: проверьте пароль и что на сервере задан QBIT_ADMIN_UPLOAD_PASSWORD (как VITE_ADMIN_PASSWORD).";
    case "presentation_pdf_only":
      return "Презентация: загрузите файл PDF.";
    case "privacy_pdf_or_html":
      return "Политика: допустимы только PDF или HTML.";
    case "too_large":
      return "Файл больше 50 МБ.";
    case "storage":
    case "db":
      return `Ошибка сервера: ${detail ?? code ?? ""}`.trim();
    default:
      return detail ?? code ?? "Ошибка загрузки";
  }
}

export async function callUploadSiteAsset(
  file: File,
  kind: "presentation" | "privacy_policy",
): Promise<{ updated_at: string; storage_path: string }> {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const password = import.meta.env.VITE_ADMIN_PASSWORD?.trim();
  if (!url || !anon || !password) {
    throw new Error(
      "Задайте VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY и VITE_ADMIN_PASSWORD для загрузки на сервер.",
    );
  }
  const fd = new FormData();
  fd.set("kind", kind);
  fd.set("file", file);
  const res = await fetch(`${url}/functions/v1/upload-site-asset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "x-qbit-admin-password": password,
    },
    body: fd,
  });
  let j: {
    ok?: boolean;
    error?: string;
    detail?: string;
    updated_at?: string;
    path?: string;
  };
  try {
    j = (await res.json()) as typeof j;
  } catch {
    throw new Error(`Ответ сервера: ${res.status}`);
  }
  if (!res.ok || !j.ok) {
    throw new Error(translateUploadError(j.error, j.detail));
  }
  const storage_path = j.path ?? "";
  const updated_at = j.updated_at ?? "";
  if (!storage_path || !updated_at) {
    throw new Error("Сервер не вернул путь или время файла.");
  }
  return { updated_at, storage_path };
}

export async function callDeleteSiteAsset(kind: "presentation" | "privacy_policy"): Promise<void> {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  const password = import.meta.env.VITE_ADMIN_PASSWORD?.trim();
  if (!url || !anon || !password) {
    throw new Error("Нет настроек Supabase или пароля админки.");
  }
  const res = await fetch(`${url}/functions/v1/upload-site-asset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${anon}`,
      apikey: anon,
      "Content-Type": "application/json",
      "x-qbit-admin-password": password,
    },
    body: JSON.stringify({ action: "delete", kind }),
  });
  let j: { ok?: boolean; error?: string; detail?: string };
  try {
    j = (await res.json()) as typeof j;
  } catch {
    throw new Error(`Ответ сервера: ${res.status}`);
  }
  if (!res.ok || !j.ok) {
    throw new Error(translateUploadError(j.error, j.detail));
  }
}
