# Деплой статического сайта (allqbit.ru)

Сайт — это продакшн-сборка Vite (`dist/`). На сервере файлы **не** собирают: сначала `npm run build` на **локальном Windows**, затем копирование `dist` на сервер.

## Где на сервере

| Что | Значение |
|-----|----------|
| SSH | `root@72.56.6.85` (хост в сети может называться `supabase`) |
| Каталог сайта на диске | `/opt/supabase/volumes/allqbit-static` |
| В Caddy (Docker) | смонтировано как `/srv/allqbit` в контейнере `supabase-caddy` |
| Домены | `allqbit.ru`, `www.allqbit.ru` |

Перезапуск контейнеров **не** нужен: Caddy отдаёт файлы с диска, изменения подхватываются сразу.

## Шаг 1 — сборка (PowerShell, папка проекта)

Корень — каталог, где лежит `package.json` (у разработчика путь к диску может отличаться).

```powershell
Set-Location <путь>\qbit-site
npm run build
```

Пример: `C:\Users\user\Desktop\site\qbit-site`.

Убедиться, что `dist\index.html` и `dist\assets\` существуют и без ошибок.

## Шаг 2 — выгрузка на сервер (PowerShell)

Подставьте тот же путь к `qbit-site`, что в шаге 1.

```powershell
scp -r <путь>\qbit-site\dist\. root@72.56.6.85:/opt/supabase/volumes/allqbit-static/
```

Если вариант с `dist\.` не сработал:

```powershell
scp -r <путь>\qbit-site\dist\* root@72.56.6.85:/opt/supabase/volumes/allqbit-static/
```

Ввести пароль при запросе. Дождаться 100% по файлам.

## Шаг 3 — по желанию: убрать старые бандлы Vite

После каждой сборки Vite в `dist/assets` появляются **новые** `index-XXXXXX.js` и `index-XXXXXX.css` с другими хешами. Старые копии на сервере **не** удаляются `scp` автоматически. Имеет смысл удалить **устаревшие** файлы в `assets/`, оставив только те два имени, которые соответствуют текущей папке `dist\assets\` (или сначала посмотреть список).

Просмотр (SSH на сервере):

```bash
ls -la /opt/supabase/volumes/allqbit-static/assets
```

Удаление конкретных старых файлов (подставьте **реальные** старые имена, не трогайте текущие из последней сборки):

```bash
cd /opt/supabase/volumes/allqbit-static/assets && rm -f index-СТАРЫЙ.js index-СТАРЫЙ.css
```

С PowerShell в одну строку:

```powershell
ssh root@72.56.6.85 "ls -la /opt/supabase/volumes/allqbit-static/assets"
```

## Проверка

Открыть https://allqbit.ru (при необходимости жёсткое обновление: Ctrl+F5).

## Чат с ИИ (n8n)

- В `.env` для прод-сборки: `VITE_AI_CHAT_URL` = **Production** Webhook URL n8n (не Test), например `https://<n8n>/webhook/qbit-site-chat`.
- В теле POST уходят `messages` и `client_visitor_id` (стабильный UUID в `localStorage`, ключ `qbit_site_visitor_id`).
- В n8n: CORS для origin прод-сайта; ответ JSON с полем `reply`, `message` или `text` (см. `parseReply` в `AiChatWidget.tsx`).

## Заметки для агента (Cursor)

- Собирать и выкладывать нужно **содержимое `dist`**, а не сырой `public/` (если не оговорено иначе).
- `logo.svg` / картинки / `presentation-*.html` в `public` попадают в `dist` при сборке — правки вносятся в исходниках, затем снова `build` + `scp`.
- Другой стек (Supabase Studio на том же Caddy) на отдельном домене/роуте — **не** пересобирать `docker compose` ради лендинга, если не менялись тома или `Caddyfile` в `/opt/supabase/volumes/proxy/caddy/`.
