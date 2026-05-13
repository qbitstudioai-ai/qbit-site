import { createReadStream, existsSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath, URL } from "node:url"
import type { Plugin } from "vite"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const UTF8_LLMS_FILES = new Set(["llms.txt", "llms-full.txt"])

/** text/plain без charset ломает кириллицу в браузере; явно задаём UTF-8 для llms*.txt */
function utf8PlainTextLlmsPlugin(): Plugin {
  return {
    name: "utf8-plain-text-llms",
    enforce: "pre",
    configureServer(server) {
      const dir = server.config.publicDir
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0]?.split("/").pop()
        if (!name || !UTF8_LLMS_FILES.has(name)) return next()
        const filePath = resolve(dir, name)
        if (!existsSync(filePath)) return next()
        res.setHeader("Content-Type", "text/plain; charset=utf-8")
        const stream = createReadStream(filePath)
        stream.on("error", () => next())
        stream.pipe(res)
      })
    },
    configurePreviewServer(server) {
      const dir = server.config.build.outDir
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split("?")[0]?.split("/").pop()
        if (!name || !UTF8_LLMS_FILES.has(name)) return next()
        const filePath = resolve(dir, name)
        if (!existsSync(filePath)) return next()
        res.setHeader("Content-Type", "text/plain; charset=utf-8")
        const stream = createReadStream(filePath)
        stream.on("error", () => next())
        stream.pipe(res)
      })
    },
  }
}

function siteUrlFromEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return (env.VITE_SITE_URL ?? 'https://allqbit.ru').replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const siteUrl = siteUrlFromEnv(mode)

  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          automationExamples: resolve(__dirname, "automation-examples.html"),
        },
      },
    },
    plugins: [
      utf8PlainTextLlmsPlugin(),
      react(),
      {
        name: 'inject-site-url-html',
        transformIndexHtml(html) {
          return html.replaceAll('__SITE_URL__', siteUrl)
        },
      },
    ],
    server: {
      host: true,
      port: 5173,
      strictPort: false,
      open: true,
    },
  }
})
