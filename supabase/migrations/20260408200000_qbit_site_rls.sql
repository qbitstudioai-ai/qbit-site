-- qbit_site: шаг 2 — доступ к схеме и RLS для anon / authenticated
-- Выполнить в Supabase → SQL Editor после шага 1.
--
-- Важно: ключ anon в браузере будет виден всем — эти политики допускают вставку и
-- обновление строк любым, кто знает URL и anon key. Защиту от спама добавляйте
-- отдельно (Edge Function, rate limit, CAPTCHA). service_role обходит RLS (бэкенд).

-- Схема должна быть доступна для PostgREST
GRANT USAGE ON SCHEMA qbit_site TO anon, authenticated, service_role;

-- Убрать лишнее с PUBLIC (если было выдано по умолчанию)
REVOKE ALL ON ALL TABLES IN SCHEMA qbit_site FROM PUBLIC;

-- Сайт шлёт события под anon (или authenticated): только INSERT и UPDATE (heartbeat,
-- закрытие page_view, upsert visitor). SELECT не выдаём — чужие строки через API не читаются.
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA qbit_site TO anon, authenticated;

-- Сервисный ключ (Edge Functions и т.п.) — полный доступ к таблицам схемы
GRANT ALL ON ALL TABLES IN SCHEMA qbit_site TO service_role;

-- Новые таблицы в qbit_site (если добавите позже) — те же права
ALTER DEFAULT PRIVILEGES IN SCHEMA qbit_site
  GRANT INSERT, UPDATE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA qbit_site
  GRANT ALL ON TABLES TO service_role;

-- RLS: ко всем строкам применяются политики; без политики операция запрещена
ALTER TABLE qbit_site.visitors ENABLE ROW LEVEL SECURITY;

ALTER TABLE qbit_site.sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE qbit_site.page_views ENABLE ROW LEVEL SECURITY;

ALTER TABLE qbit_site.events ENABLE ROW LEVEL SECURITY;

-- Удалить одноимённые политики при повторном запуске скрипта
DROP POLICY IF EXISTS qbit_visitors_insert ON qbit_site.visitors;
DROP POLICY IF EXISTS qbit_visitors_update ON qbit_site.visitors;
DROP POLICY IF EXISTS qbit_sessions_insert ON qbit_site.sessions;
DROP POLICY IF EXISTS qbit_sessions_update ON qbit_site.sessions;
DROP POLICY IF EXISTS qbit_page_views_insert ON qbit_site.page_views;
DROP POLICY IF EXISTS qbit_page_views_update ON qbit_site.page_views;
DROP POLICY IF EXISTS qbit_events_insert ON qbit_site.events;

-- visitors: создание и обновление (upsert по anonymous_id с клиента)
CREATE POLICY qbit_visitors_insert ON qbit_site.visitors
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY qbit_visitors_update ON qbit_site.visitors
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- sessions
CREATE POLICY qbit_sessions_insert ON qbit_site.sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY qbit_sessions_update ON qbit_site.sessions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- page_views
CREATE POLICY qbit_page_views_insert ON qbit_site.page_views
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY qbit_page_views_update ON qbit_site.page_views
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- events: только вставка
CREATE POLICY qbit_events_insert ON qbit_site.events
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- SELECT для anon/authenticated не выдавался и политик нет — чтение через API с anon key невозможно.
-- Table Editor в Dashboard ходит под ролью с правами выше RLS (админ) — таблицы остаются видимыми.
