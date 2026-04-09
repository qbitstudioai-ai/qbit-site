/**
 * Убирает однотонные поля по краям (белый/светлый фон у AI-экспорта),
 * чтобы в браузере при одном и том же CSS «чёрный рисунок» занимал больше места.
 * Без исходных SVG — правим уже существующие .webp в public/.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

/** Допуск к цвету углового пикселя (антиалиасинг JPEG→WebP) */
const TRIM_THRESHOLD = 38;

async function trimOne(file) {
  const full = path.join(publicDir, file);
  const input = fs.readFileSync(full);
  const metaBefore = await sharp(input).metadata();

  let pipeline = sharp(input).trim({ threshold: TRIM_THRESHOLD });
  let buf;
  try {
    buf = await pipeline.webp({ quality: 92, effort: 6 }).toBuffer();
  } catch {
    return { file, ok: false, reason: "trim-not-applicable" };
  }

  const metaAfter = await sharp(buf).metadata();
  if (
    metaAfter.width === metaBefore.width &&
    metaAfter.height === metaBefore.height
  ) {
    return { file, ok: true, reason: "unchanged" };
  }

  fs.writeFileSync(full, buf);
  return {
    file,
    ok: true,
    reason: "trimmed",
    before: `${metaBefore.width}×${metaBefore.height}`,
    after: `${metaAfter.width}×${metaAfter.height}`,
  };
}

const webps = fs.readdirSync(publicDir).filter((f) => f.endsWith(".webp")).sort();

const rows = [];
for (const f of webps) {
  rows.push(await trimOne(f));
}

const trimmed = rows.filter((r) => r.reason === "trimmed");
const skipped = rows.filter((r) => !r.ok || r.reason === "unchanged");

console.log(`Trim threshold=${TRIM_THRESHOLD}, files=${webps.length}`);
console.log(`Trimmed (${trimmed.length}):`);
for (const r of trimmed) {
  console.log(`  ${r.file}: ${r.before} → ${r.after}`);
}
console.log(`Unchanged / skipped (${skipped.length})`);
