/**
 * История чата в localStorage: один и тот же стор для главной (SPA) и
 * /automation-examples.html — переписка и `client_visitor_id` (отдельный ключ)
 * сохраняются при смене страницы; в n8n уходит тот же payload messages + id гостя.
 */
export const CHAT_HISTORY_STORAGE_KEY = "qbit_site_chat_history_v1";
const MAX_MESSAGES = 120;
const MAX_JSON_CHARS = 750_000;

export type ChatMsgPersisted = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StoredV1 = { v: 1; messages: ChatMsgPersisted[] };

function trimMessages(msgs: ChatMsgPersisted[]): ChatMsgPersisted[] {
  if (msgs.length <= MAX_MESSAGES) return msgs;
  return msgs.slice(msgs.length - MAX_MESSAGES);
}

export function readChatHistoryFromStorage(): ChatMsgPersisted[] | null {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!s) return null;
    const p = JSON.parse(s) as Partial<StoredV1> | null;
    if (!p || p.v !== 1 || !Array.isArray(p.messages)) return null;
    const out: ChatMsgPersisted[] = [];
    for (const m of p.messages) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
      if (typeof m.content !== "string") continue;
      out.push({
        id: typeof m.id === "string" && m.id ? m.id : crypto.randomUUID(),
        role: m.role,
        content: m.content,
      });
    }
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function writeChatHistoryToStorage(messages: ChatMsgPersisted[]): void {
  if (typeof window === "undefined") return;
  try {
    if (messages.length === 0) {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
      return;
    }
    let list = trimMessages(messages);
    let payload: StoredV1 = { v: 1, messages: list };
    let str = JSON.stringify(payload);
    while (str.length > MAX_JSON_CHARS && list.length > 4) {
      list = list.slice(-Math.max(4, Math.floor(list.length * 0.65)));
      payload = { v: 1, messages: list };
      str = JSON.stringify(payload);
    }
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, str);
  } catch {
    /* quota / private mode */
  }
}
