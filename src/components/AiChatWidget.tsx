import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

const ICON_SRC = "/chat-widget-icon.webp";

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

export function AiChatWidget() {
  const { resolvedContacts: L } = useSiteSettings();
  const { aiChat } = useSiteContent();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, pending]);

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

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
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

  return (
    <div className="ai-chat-widget">
      {open ? (
        <div
          id={panelId}
          className="ai-chat-widget__panel"
          role="dialog"
          aria-label={aiChat.title}
        >
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
