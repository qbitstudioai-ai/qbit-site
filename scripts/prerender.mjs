/**
 * Post-build prerender for the main landing (`/`).
 * Serves `dist` via `vite preview`, renders in headless Chromium, injects `#root` HTML into `dist/index.html`.
 */
import { spawn } from "node:child_process"
import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, "..")
const distIndex = path.join(projectRoot, "dist", "index.html")
const port = process.env.PRERENDER_PREVIEW_PORT ?? "4179"
const origin = `http://127.0.0.1:${port}`

async function waitForPreview(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "manual" })
      if (res.ok || res.status === 304) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`[prerender] timed out waiting for preview at ${url}`)
}

function spawnPreview() {
  const viteCli = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js")
  return spawn(process.execPath, [viteCli, "preview", "--host", "127.0.0.1", "--port", port, "--strictPort"], {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: ["ignore", "inherit", "inherit"],
  })
}

async function main() {
  const indexBefore = await fs.readFile(distIndex, "utf8")

  const preview = spawnPreview()
  try {
    await waitForPreview(`${origin}/`)

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    try {
      const page = await browser.newPage()
      await page.goto(`${origin}/`, { waitUntil: "load", timeout: 120_000 })
      await page.waitForSelector("main#main", { timeout: 60_000 })
      const rootInner = await page.$eval("#root", (el) => el.innerHTML)
      if (!rootInner?.trim()) {
        throw new Error("[prerender] #root innerHTML is empty")
      }

      const next = indexBefore.replace(
        /<div id="root">\s*<\/div>/,
        `<div id="root">${rootInner}</div>`,
      )
      if (next === indexBefore) {
        throw new Error(
          "[prerender] could not find empty <div id=\"root\"></div> in dist/index.html",
        )
      }
      await fs.writeFile(distIndex, next, "utf8")
      console.log("[prerender] updated dist/index.html")
    } finally {
      await browser.close()
    }
  } finally {
    preview.kill("SIGTERM")
    await new Promise((r) => setTimeout(r, 400))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
