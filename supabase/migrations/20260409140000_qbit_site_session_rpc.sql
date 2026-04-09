-- Один вызов вместо INSERT + 409: upsert сессии по session_key (только last_activity при конфликте)
-- Выполнить в SQL Editor на сервере, если ещё не применяли.

CREATE OR REPLACE FUNCTION public.qbit_site_upsert_session(
  p_session_row_id uuid,
  p_visitor_row_id uuid,
  p_session_key text,
  p_started_at timestamptz,
  p_last_activity_at timestamptz,
  p_client_timezone text,
  p_referrer text,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_term text,
  p_utm_content text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = qbit_site, public
AS $$
BEGIN
  INSERT INTO qbit_site.sessions (
    id,
    visitor_id,
    session_key,
    started_at,
    last_activity_at,
    client_timezone,
    referrer,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content,
    geo
  ) VALUES (
    p_session_row_id,
    p_visitor_row_id,
    p_session_key,
    p_started_at,
    p_last_activity_at,
    p_client_timezone,
    p_referrer,
    p_utm_source,
    p_utm_medium,
    p_utm_campaign,
    p_utm_term,
    p_utm_content,
    '{}'::jsonb
  )
  ON CONFLICT (session_key) DO UPDATE SET
    last_activity_at = EXCLUDED.last_activity_at;
END;
$$;

REVOKE ALL ON FUNCTION public.qbit_site_upsert_session(
  uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, text, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.qbit_site_upsert_session(
  uuid, uuid, text, timestamptz, timestamptz, text, text, text, text, text, text, text
) TO anon, authenticated;

COMMENT ON FUNCTION public.qbit_site_upsert_session IS 'Аналитика: вставка сессии или обновление last_activity без 409 в браузере';
