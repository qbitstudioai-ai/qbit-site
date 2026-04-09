/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Канонический origin без слэша в конце (Open Graph, JSON-LD). По умолчанию: https://allqbit.ru */
  readonly VITE_SITE_URL?: string;
  /** POST JSON { messages: { role, content }[] } → ответ см. parseReply в AiChatWidget */
  readonly VITE_AI_CHAT_URL?: string;
  /** Переопределение логина админки (иначе значение из adminAuth.ts) */
  readonly VITE_ADMIN_LOGIN?: string;
  /** Переопределение пароля админки */
  readonly VITE_ADMIN_PASSWORD?: string;
  /** Self-hosted или cloud: Project URL без слэша в конце (напр. https://supabase.allqbit.ru) */
  readonly VITE_SUPABASE_URL?: string;
  /** Anon (public) key из Dashboard → Settings → API */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
