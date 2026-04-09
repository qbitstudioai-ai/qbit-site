-- Публичные тексты сайта (мердж с дефолтами в коде). Чтение — anon; запись — Edge Function (service_role).

CREATE TABLE IF NOT EXISTS qbit_site.site_copy (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO qbit_site.site_copy (id, payload)
VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE qbit_site.site_copy ENABLE ROW LEVEL SECURITY;

REVOKE INSERT, UPDATE, DELETE ON qbit_site.site_copy FROM anon, authenticated;
GRANT SELECT ON qbit_site.site_copy TO anon, authenticated;
GRANT ALL ON qbit_site.site_copy TO service_role;

DROP POLICY IF EXISTS qbit_site_copy_select ON qbit_site.site_copy;
CREATE POLICY qbit_site_copy_select ON qbit_site.site_copy
  FOR SELECT TO anon, authenticated
  USING (true);
