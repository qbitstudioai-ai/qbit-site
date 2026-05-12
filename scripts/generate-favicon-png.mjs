/**
 * Favicon из public/favicon.svg: PNG + favicon.ico (роботы Яндекса часто ходят только на /favicon.ico).
 * Запуск: npm run generate-favicon
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const svg = readFileSync(join(root, "public", "favicon.svg"));

const targets = [
  ["favicon-32.png", 32],
  ["favicon-48.png", 48],
  ["apple-touch-icon.png", 180],
];

for (const [name, size] of targets) {
  await sharp(svg).resize(size, size).png().toFile(join(root, "public", name));
  console.log("wrote public/" + name);
}

const png16 = await sharp(svg).resize(16, 16).png().toBuffer();
const png32b = await sharp(svg).resize(32, 32).png().toBuffer();
const ico = await toIco([png16, png32b]);
writeFileSync(join(root, "public", "favicon.ico"), ico);
console.log("wrote public/favicon.ico");
