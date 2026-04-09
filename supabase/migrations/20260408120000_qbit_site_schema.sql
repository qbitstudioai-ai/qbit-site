-- qbit_site: аналитика посещений лендинга (шаг 1 — только схема и таблицы)
-- Выполнить в Supabase → SQL Editor (роль postgres / Dashboard).

CREATE SCHEMA IF NOT EXISTS qbit_site;

-- Стабильный «посетитель» в рамках браузера (anonymous_id с клиента)
CREATE TABLE qbit_site.visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id text NOT NULL,
  email text,
  phone text,
  full_name text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT visitors_anonymous_id_key UNIQUE (anonymous_id)
);

COMMENT ON TABLE qbit_site.visitors IS 'Посетитель: анонимный id + контакты, если пользователь их передал';
COMMENT ON COLUMN qbit_site.visitors.anonymous_id IS 'Стабильный UUID/строка из localStorage';
COMMENT ON COLUMN qbit_site.visitors.email IS 'Email при явной передаче (форма, заявка)';
COMMENT ON COLUMN qbit_site.visitors.phone IS 'Телефон при явной передаче';
COMMENT ON COLUMN qbit_site.visitors.full_name IS 'Имя при явной передаче';

-- Один визит (сессия): время, источник, UTM, IP, гео
CREATE TABLE qbit_site.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL REFERENCES qbit_site.visitors (id) ON DELETE CASCADE,
  session_key text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  client_timezone text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  ip_address inet,
  country text,
  region text,
  city text,
  geo jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT sessions_session_key_key UNIQUE (session_key)
);

COMMENT ON TABLE qbit_site.sessions IS 'Сессия визита: метки времени, referrer, UTM, IP, гео по IP';
COMMENT ON COLUMN qbit_site.sessions.session_key IS 'Идентификатор сессии с клиента (UUID)';
COMMENT ON COLUMN qbit_site.sessions.last_activity_at IS 'Последняя активность (heartbeat / событие)';
COMMENT ON COLUMN qbit_site.sessions.ended_at IS 'Оценка завершения сессии (уход, таймаут)';
COMMENT ON COLUMN qbit_site.sessions.client_timezone IS 'IANA или смещение, напр. Europe/Moscow';
COMMENT ON COLUMN qbit_site.sessions.geo IS 'Доп. поля гео (провайдер, raw) в JSON';

-- Просмотр страницы внутри сессии
CREATE TABLE qbit_site.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES qbit_site.sessions (id) ON DELETE CASCADE,
  path text NOT NULL,
  query_string text,
  entered_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  duration_seconds integer,
  CONSTRAINT page_views_duration_non_negative CHECK (
    duration_seconds IS NULL OR duration_seconds >= 0
  )
);

COMMENT ON TABLE qbit_site.page_views IS 'Страница: вход, выход, длительность';
COMMENT ON COLUMN qbit_site.page_views.path IS 'Путь URL без хоста, напр. /pricing';
COMMENT ON COLUMN qbit_site.page_views.query_string IS 'Query без хоста; можно не писать из соображений приватности';

-- События (клики, отправки и т.д.)
CREATE TABLE qbit_site.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES qbit_site.sessions (id) ON DELETE CASCADE,
  event_name text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE qbit_site.events IS 'События взаимодействия в рамках сессии';
COMMENT ON COLUMN qbit_site.events.payload IS 'Произвольные свойства события (JSON)';

-- Индексы под отчёты и вставки с клиента по session_key / сессии
CREATE INDEX idx_qbit_visitors_first_seen ON qbit_site.visitors (first_seen_at DESC);

CREATE INDEX idx_qbit_sessions_visitor_started ON qbit_site.sessions (visitor_id, started_at DESC);
CREATE INDEX idx_qbit_sessions_last_activity ON qbit_site.sessions (last_activity_at DESC);

CREATE INDEX idx_qbit_page_views_session_entered ON qbit_site.page_views (session_id, entered_at);
CREATE INDEX idx_qbit_page_views_path ON qbit_site.page_views (path);

CREATE INDEX idx_qbit_events_session_occurred ON qbit_site.events (session_id, occurred_at DESC);
CREATE INDEX idx_qbit_events_name ON qbit_site.events (event_name);
