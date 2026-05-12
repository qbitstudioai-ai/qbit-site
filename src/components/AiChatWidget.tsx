import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  readChatHistoryFromStorage,
  writeChatHistoryToStorage,
} from "../lib/aiChatWidgetStorage";
import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";
import "./aiChatWidget.css";

const ICON_SRC = "/chat-widget-icon.webp";
const VISITOR_STORAGE_KEY = "qbit_site_visitor_id";
const PANEL_HEIGHT_STORAGE_KEY = "qbit_chat_panel_height_px";
const PANEL_H_MIN = 200;
/** Резерв под FAB, отступы и safe-area */
const PANEL_BOTTOM_RESERVE_PX = 100;

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function parseReply(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.reply === "string") return o.reply;
  if (typeof o.message === "string") return o.message;
  if (typeof o.text === "string") return o.text;
  const choices = o.choices;
  if (Array.isArray(choices) && choices[0] && typeof choices[0] === "object") {
    const c0 = choices[0] as Record<string, unknown>;
    const msg = c0.message;
    if (msg && typeof msg === "object") {
      const content = (msg as Record<string, unknown>).content;
      if (typeof content === "string") return content;
    }
  }
  return null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getPanelMaxHeightPx(): number {
  if (typeof window === "undefined") return 600;
  return Math.max(PANEL_H_MIN, window.innerHeight - PANEL_BOTTOM_RESERVE_PX);
}

function readSavedPanelHeight(): number | null {
  try {
    const s = localStorage.getItem(PANEL_HEIGHT_STORAGE_KEY);
    if (!s) return null;
    const n = parseInt(s, 10);
    if (!Number.isFinite(n)) return null;
    return clamp(n, PANEL_H_MIN, getPanelMaxHeightPx());
  } catch {
    return null;
  }
}

/** Стабильный UUID гостя для корреляции с аналитикой / n8n; хранится в localStorage. */
function getOrCreateClientVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_STORAGE_KEY, id);
    return id;
  } catch {
    try {
      const sessKey = `${VISITOR_STORAGE_KEY}_session`;
      const s = sessionStorage.getItem(sessKey);
      if (s && /^[0-9a-f-]{36}$/i.test(s)) return s;
      const id = crypto.randomUUID();
      sessionStorage.setItem(sessKey, id);
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }
}

export function AiChatWidget() {
  const { resolvedContacts: L } = useSiteSettings();
  const { aiChat } = useSiteContent();
  const panelId = useId();
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = readChatHistoryFromStorage();
    if (stored && stored.length > 0) {
      return stored.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
    }
    return [];
  });
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelHeightPx, setPanelHeightPx] = useState<number | null>(() => readSavedPanelHeight());
  const dragRef = useRef<{ startY: number; startH: number; pointerId: number } | null>(null);
  const resizeHeightAfterDragRef = useRef<number | null>(null);

  useEffect(() => {
    if (readChatHistoryFromStorage()?.length) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [{ id: crypto.randomUUID(), role: "assistant", content: aiChat.welcome }];
    });
  }, [aiChat.welcome]);

  useEffect(() => {
    if (messages.length > 0) {
      writeChatHistoryToStorage(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, pending]);

  useEffect(() => {
    const onResize = () => {
      setPanelHeightPx((h) => {
        if (h == null) return h;
        const max = getPanelMaxHeightPx();
        const next = clamp(h, PANEL_H_MIN, max);
        if (next !== h) {
          try {
            localStorage.setItem(PANEL_HEIGHT_STORAGE_KEY, String(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setMessages((m) =>
      m.length === 0
        ? [{ id: crypto.randomUUID(), role: "assistant", content: aiChat.welcome }]
        : m,
    );
    setOpen(true);
  }

  function onResizePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    const handle = e.currentTarget;
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const startH = panelHeightPx ?? rect.height;
    dragRef.current = { startY: e.clientY, startH, pointerId: e.pointerId };
    resizeHeightAfterDragRef.current = null;
    handle.setPointerCapture(e.pointerId);
    const max = getPanelMaxHeightPx();

    const onMove = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      const deltaY = d.startY - ev.clientY;
      const next = clamp(d.startH + deltaY, PANEL_H_MIN, max);
      resizeHeightAfterDragRef.current = next;
      setPanelHeightPx(next);
    };

    const onUp = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d || ev.pointerId !== d.pointerId) return;
      try {
        handle.releasePointerCapture(ev.pointerId);
      } catch {
        /* */
      }
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      dragRef.current = null;
      const toSave = resizeHeightAfterDragRef.current;
      resizeHeightAfterDragRef.current = null;
      if (toSave != null) {
        try {
          localStorage.setItem(PANEL_HEIGHT_STORAGE_KEY, String(toSave));
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  }

  async function runAssistant(history: ChatMsg[]) {
    const apiUrl = import.meta.env.VITE_AI_CHAT_URL?.trim();
    const payload = history.map(({ role, content }) => ({ role, content }));

    const tgShort = L.telegram.replace(/^https?:\/\//i, "");
    const offlineReply = `Сейчас ответы генерируются после подключения сервера чата. Напишите нам в Telegram — обсудим задачу: ${tgShort}`;
    const errorReply = `Не удалось получить ответ. Попробуйте ещё раз позже или напишите в Telegram: ${tgShort}`;

    if (!apiUrl) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: offlineReply },
      ]);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
    const needsApikey = Boolean(
      supabaseUrl && anon && apiUrl.startsWith(supabaseUrl),
    );
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (needsApikey && anon) {
      headers.Authorization = `Bearer ${anon}`;
      headers.apikey = anon;
    }
    const client_visitor_id = getOrCreateClientVisitorId();
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: payload, client_visitor_id }),
      });
      const data: unknown = await res.json().catch(() => null);
      const text = parseReply(data);
      if (!res.ok || !text) {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: errorReply },
        ]);
        return;
      }
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: text }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: errorReply },
      ]);
    }
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");

    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setPending(true);
    try {
      await runAssistant(history);
    } finally {
      setPending(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const panelStyle: CSSProperties | undefined =
    panelHeightPx != null ? { height: panelHeightPx, maxHeight: "none" } : undefined;

  return (
    <div className="ai-chat-widget">
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          className={`ai-chat-widget__panel${panelHeightPx != null ? " ai-chat-widget__panel--custom-height" : ""}`}
          style={panelStyle}
          role="dialog"
          aria-label={aiChat.title}
        >
          <button
            type="button"
            className="ai-chat-widget__resize"
            onPointerDown={onResizePointerDown}
            tabIndex={0}
            aria-label={aiChat.resizeLabel}
          />
          <div className="ai-chat-widget__head">
            <span className="ai-chat-widget__title">{aiChat.title}</span>
            <button
              type="button"
              className="ai-chat-widget__close"
              onClick={() => setOpen(false)}
              aria-label={aiChat.closeLabel}
            >
              ×
            </button>
          </div>
          <div className="ai-chat-widget__messages" ref={listRef}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-chat-widget__bubble ai-chat-widget__bubble--${msg.role}`}
              >
                {msg.content}
              </div>
            ))}
            {pending ? (
              <div className="ai-chat-widget__bubble ai-chat-widget__bubble--assistant ai-chat-widget__typing">
                …
              </div>
            ) : null}
          </div>
          <div className="ai-chat-widget__composer">
            <textarea
              className="ai-chat-widget__input"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={aiChat.inputPlaceholder}
              disabled={pending}
              aria-label={aiChat.inputPlaceholder}
            />
            <button
              type="button"
              className="ai-chat-widget__send"
              onClick={() => void handleSend()}
              disabled={pending || !draft.trim()}
            >
              {aiChat.sendLabel}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="ai-chat-widget__fab"
        onClick={handleToggle}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={open ? aiChat.closeLabel : aiChat.openLabel}
      >
        <img src={ICON_SRC} alt="" width={48} height={48} decoding="async" loading="lazy" />
      </button>
    </div>
  );
}
