import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function siteUrlFromEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return (env.VITE_SITE_URL ?? 'https://allqbit.ru').replace(/\/+$/, '')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const siteUrl = siteUrlFromEnv(mode)

  return {
    plugins: [
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
