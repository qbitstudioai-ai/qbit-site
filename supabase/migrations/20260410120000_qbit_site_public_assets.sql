-- Публичные файлы сайта (презентация, политика) в Storage + метки версий для cache-bust URL.
-- Загрузка только через Edge Function (service_role); чтение — для всех.

-- Таблица: какой ассет обновлён и когда (anon может SELECT для сборки URL)
CREATE TABLE IF NOT EXISTS qbit_site.site_asset_versions (
  asset_key text PRIMARY KEY,
  updated_at timestamptz NOT NULL DEFAULT now(),
  storage_path text NOT NULL DEFAULT '',
  CONSTRAINT site_asset_versions_key_check CHECK (
    asset_key IN ('presentation', 'privacy_policy')
  )
);

COMMENT ON TABLE qbit_site.site_asset_versions IS 'Публичные файлы в Storage: путь объекта + updated_at для cache-bust в URL';
COMMENT ON COLUMN qbit_site.site_asset_versions.storage_path IS 'Ключ объекта в bucket qbit_site_files, напр. presentation.pdf';

ALTER TABLE qbit_site.site_asset_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_asset_versions_select ON qbit_site.site_asset_versions;
CREATE POLICY site_asset_versions_select ON qbit_site.site_asset_versions
  FOR SELECT TO anon, authenticated
  USING (true);

GRANT SELECT ON qbit_site.site_asset_versions TO anon, authenticated;

-- Bucket (если уже есть — INSERT пропустите вручную или используйте ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qbit_site_files',
  'qbit_site_files',
  true,
  52428800,
  ARRAY['application/pdf', 'text/html']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS qbit_site_files_select ON storage.objects;
CREATE POLICY qbit_site_files_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'qbit_site_files');

-- Запись в bucket только service_role (RLS: нет политики INSERT для anon)
