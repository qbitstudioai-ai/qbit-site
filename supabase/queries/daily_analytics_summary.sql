-- Сводка по дням (календарь Europe/Moscow). Длительность — сумма известных duration_seconds, в минутах.
-- Запуск: Supabase SQL Editor → вставить или открыть файл → Run.
-- Убрать фильтр по 30 дням: удалите блок WHERE ... в финальном SELECT.

WITH sess AS (
  SELECT
    (started_at AT TIME ZONE 'Europe/Moscow')::date AS d,
    COUNT(*) AS sessions_started,
    COUNT(DISTINCT visitor_id) AS unique_visitors
  FROM qbit_site.sessions
  GROUP BY 1
),
pv AS (
  SELECT
    (entered_at AT TIME ZONE 'Europe/Moscow')::date AS d,
    COUNT(*) AS page_views,
    ROUND(
      COALESCE(SUM(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL), 0) / 60.0,
      2
    ) AS duration_tracked_minutes
  FROM qbit_site.page_views
  GROUP BY 1
),
merged AS (
  SELECT
    COALESCE(sess.d, pv.d) AS report_date,
    COALESCE(sess.sessions_started, 0) AS sessions_started,
    COALESCE(sess.unique_visitors, 0) AS unique_visitors,
    COALESCE(pv.page_views, 0) AS page_views,
    COALESCE(pv.duration_tracked_minutes, 0) AS duration_tracked_minutes
  FROM sess
  FULL OUTER JOIN pv ON sess.d = pv.d
)
SELECT *
FROM merged
WHERE report_date >= (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow')::date - 30
ORDER BY report_date DESC;
