# Деплой на VPS (см. PROJECT-MEMO.txt). Требуются SSH-доступ и npm run build.
param(
  [string]$Server = "72.56.6.85",
  [string]$User = "root"
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path "$repo\dist\index.html")) {
  Write-Host "Нет dist — выполните: npm run build" -ForegroundColor Red
  exit 1
}

Write-Host "1/3 Статика dist -> /opt/supabase/volumes/allqbit-static/" -ForegroundColor Cyan
Set-Location "$repo\dist"
scp -r * "${User}@${Server}:/opt/supabase/volumes/allqbit-static/"

Write-Host "2/4 Edge Function upload-site-asset" -ForegroundColor Cyan
scp "$repo\supabase\functions\upload-site-asset\index.ts" "${User}@${Server}:/opt/supabase/volumes/functions/upload-site-asset/index.ts"

Write-Host "3/4 Edge Function serve-privacy-html (целиком папка)" -ForegroundColor Cyan
scp -r "$repo\supabase\functions\serve-privacy-html" "${User}@${Server}:/opt/supabase/volumes/functions/"

Write-Host "4/4 Перезапуск контейнера functions" -ForegroundColor Cyan
ssh "${User}@${Server}" "cd /opt/supabase && docker compose restart functions"

Write-Host "Готово. Проверьте https://allqbit.ru и загрузку политики в админке." -ForegroundColor Green
