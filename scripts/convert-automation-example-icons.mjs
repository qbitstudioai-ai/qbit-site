/**
 * Сжимает иконки для automation-examples.html: как на главной — WebP,
 * макс. 256px по длинной стороне (в CSS ~80–100px, 2x запас).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const files = [
  "automation-call-managers.png",
  "automation-manager-reports-v2.png",
  "automation-ai-assistant-docs-v3.png",
  "automation-landing-business-logo.png",
];

const MAX = 256;

for (const name of files) {
  const inputPath = path.join(publicDir, name);
  if (!fs.existsSync(inputPath)) {
    console.warn("skip (missing):", name);
    continue;
  }
  const outName = name.replace(/\.png$/i, ".webp");
  const outPath = path.join(publicDir, outName);
  const inStat = fs.statSync(inputPath);

  const buf = await sharp(inputPath)
    .resize(MAX, MAX, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();

  fs.writeFileSync(outPath, buf);
  const meta = await sharp(buf).metadata();
  console.log(
    `${outName}: ${(inStat.size / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB, ${meta.width}×${meta.height}`,
  );
}
