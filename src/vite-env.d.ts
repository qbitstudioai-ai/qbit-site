/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Канонический origin без слэша в конце (Open Graph, JSON-LD). По умолчанию: https://allqbit.ru */
  readonly VITE_SITE_URL?: string;
  /**
   * Production URL чата (вшивается при сборке). Обычно Webhook n8n, напр. https://…/webhook/qbit-site-chat
   * (не Test URL). Тело POST: { messages, client_visitor_id }; ответ см. parseReply в AiChatWidget.
   * Если URL начинается с VITE_SUPABASE_URL, к запросу добавляются apikey / Authorization (Kong).
   */
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
