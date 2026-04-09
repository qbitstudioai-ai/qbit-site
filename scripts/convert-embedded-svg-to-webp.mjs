/**
 * Конвертирует «фальш-SVG» Adobe (один <image> с data: URI) в .webp умеренного размера.
 * Векторные SVG (logo, favicon и т.д.) пропускает.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const SOCIAL_STYLE = new Set([
  "telegram-card-icon.svg",
  "vk-card-icon.svg",
  "cta-openai-icon.svg",
  "cta-phone-icon.svg",
]);

function targetWidth(filename) {
  if (filename === "chat-widget-icon.svg") return 96;
  if (SOCIAL_STYLE.has(filename)) return 200;
  return 360;
}

function extractRasterBuffer(svgText) {
  const m = svgText.match(/xlink:href="data:image\/(png|jpeg|jpg);base64,([\s\S]*?)"/i);
  if (!m) return null;
  const b64 = m[2].replace(/\s+/g, "");
  try {
    return Buffer.from(b64, "base64");
  } catch {
    return null;
  }
}

async function convertFile(filename) {
  if (!filename.endsWith(".svg")) return { filename, skipped: true, reason: "not-svg" };
  const full = path.join(publicDir, filename);
  if (!fs.existsSync(full)) return { filename, skipped: true, reason: "missing" };

  const svgText = fs.readFileSync(full, "utf8");
  const buf = extractRasterBuffer(svgText);
  if (!buf) return { filename, skipped: true, reason: "no-embedded-raster" };

  const outName = filename.replace(/\.svg$/i, ".webp");
  const outPath = path.join(publicDir, outName);
  const w = targetWidth(filename);

  await sharp(buf)
    .resize({ width: w, withoutEnlargement: true, fit: "inside" })
    .webp({ quality: 88, effort: 6 })
    .toFile(outPath);

  const inKb = (fs.statSync(full).size / 1024).toFixed(1);
  const outKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  fs.unlinkSync(full);
  return { filename, outName, inKb, outKb, skipped: false };
}

const entries = fs.readdirSync(publicDir).filter((f) => f.endsWith(".svg"));
const results = [];
for (const f of entries.sort()) {
  results.push(await convertFile(f));
}

const done = results.filter((r) => !r.skipped);
const skipped = results.filter((r) => r.skipped);
console.log("Converted:", done.length);
for (const r of done) {
  console.log(`  ${r.filename} → ${r.outName} (${r.inKb} KB → ${r.outKb} KB)`);
}
console.log("Skipped:", skipped.length);
for (const r of skipped) {
  if (r.reason !== "no-embedded-raster") continue;
  console.log(`  ${r.filename} (${r.reason})`);
}
