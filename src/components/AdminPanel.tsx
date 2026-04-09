import { useState } from "react";
import { AdminSiteTextsSection } from "./AdminSiteTextsSection";
import { clearAdminSession } from "../siteSettings/adminAuth";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

export function AdminPanel() {
  const s = useSiteSettings();
  const [telegram, setTelegram] = useState(s.resolvedContacts.telegram);
  const [vk, setVk] = useState(s.resolvedContacts.vk);
  const [phone, setPhone] = useState(s.resolvedContacts.phone);
  const [phoneDisplay, setPhoneDisplay] = useState(s.resolvedContacts.phoneDisplay);
  const [email, setEmail] = useState(s.resolvedContacts.email);
  const [emailDisplay, setEmailDisplay] = useState(s.resolvedContacts.emailDisplay);
  const [telegramDisplay, setTelegramDisplay] = useState(s.resolvedContacts.telegramDisplay);
  const [vkDisplay, setVkDisplay] = useState(s.resolvedContacts.vkDisplay);
  const [savedContacts, setSavedContacts] = useState(false);

  function saveContacts() {
    s.updateContacts({
      telegram,
      vk,
      phone,
      phoneDisplay,
      email,
      emailDisplay,
      telegramDisplay,
      vkDisplay,
    });
    setSavedContacts(true);
    window.setTimeout(() => setSavedContacts(false), 2000);
  }

  return (
    <div className="admin-page">
      <header className="admin-page__head">
        <h1 className="admin-page__title">Панель администратора</h1>
        <div className="admin-page__head-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => {
              clearAdminSession();
              window.location.hash = "#/";
            }}
          >
            Выйти
          </button>
          <a className="admin-page__back" href="#/">
            На сайт
          </a>
        </div>
      </header>

      <div className="admin-page__note">
        {s.usesServerAssets ? (
          <>
            Презентация, политика и <strong>тексты сайта</strong> после сохранения на сервере видят все
            посетители. Контакты и переключатели (кроме текстов) по-прежнему в этом браузере (localStorage).
            Edge Functions: пароль <code>QBIT_ADMIN_UPLOAD_PASSWORD</code> (как <code>VITE_ADMIN_PASSWORD</code>
            при сборке) — для загрузки файлов и для <code>save-site-copy</code>.
          </>
        ) : (
          <>
            Supabase не настроен (<code>VITE_SUPABASE_URL</code> / ключ) — презентация и политика в IndexedDB,
            тексты страницы — в localStorage этого браузера. Вход по паролю проверяется на клиенте.
          </>
        )}
      </div>

      <AdminSiteTextsSection />

      <section className="admin-card">
        <h2 className="admin-card__title">Кнопка «Скачать презентацию»</h2>
        <label className="admin-row">
          <input
            type="checkbox"
            checked={s.presentationEnabled}
            onChange={(e) => s.setPresentationEnabled(e.target.checked)}
          />
          <span>Показывать кнопку в шапке</span>
        </label>
        <div className="admin-field">
          <span className="admin-label">Файл презентации (PDF и др.)</span>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,application/pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void (async () => {
                  try {
                    await s.uploadPresentation(f);
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : String(err));
                  }
                })();
              }
              e.target.value = "";
            }}
          />
          <p className="admin-hint">
            Сейчас:{" "}
            {s.usesServerAssets
              ? s.stored.presentationFileName
                ? `на сервере «${s.stored.presentationFileName}»`
                : "файл из public (или /presentation.pdf), пока не загрузите PDF"
              : s.stored.presentationFileName
                ? `в этом браузере «${s.stored.presentationFileName}»`
                : "файл из кода / public"}
          </p>
          {s.usesServerAssets || s.stored.presentationFileName ? (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() =>
                void (async () => {
                  try {
                    await s.clearPresentationUpload();
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : String(err));
                  }
                })()
              }
            >
              {s.usesServerAssets ? "Удалить с сервера (как в коде)" : "Сбросить загрузку (как в коде)"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Чат с ИИ</h2>
        <label className="admin-row">
          <input
            type="checkbox"
            checked={s.chatEnabled}
            onChange={(e) => s.setChatEnabled(e.target.checked)}
          />
          <span>Показывать виджет чата</span>
        </label>
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Политика конфиденциальности</h2>
        <label className="admin-row">
          <input
            type="checkbox"
            checked={s.privacyPolicyLinkEnabled}
            onChange={(e) => s.setPrivacyPolicyLinkEnabled(e.target.checked)}
          />
          <span>Показывать ссылку в тексте cookie-баннера</span>
        </label>
        <div className="admin-field">
          <span className="admin-label">Файл политики</span>
          <input
            type="file"
            accept=".pdf,.html,application/pdf,text/html"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void (async () => {
                  try {
                    await s.uploadPrivacyPolicy(f);
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : String(err));
                  }
                })();
              }
              e.target.value = "";
            }}
          />
          <p className="admin-hint">
            Сейчас:{" "}
            {s.usesServerAssets
              ? s.stored.privacyPolicyFileName
                ? `на сервере «${s.stored.privacyPolicyFileName}»`
                : "файл из public, пока не загрузите PDF/HTML"
              : s.stored.privacyPolicyFileName
                ? `в этом браузере «${s.stored.privacyPolicyFileName}»`
                : `путь из кода: ${s.privacyPolicyHref.startsWith("blob:") ? "blob…" : s.privacyPolicyHref}`}
          </p>
          {s.usesServerAssets || s.stored.privacyPolicyFileName ? (
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() =>
                void (async () => {
                  try {
                    await s.clearPrivacyUpload();
                  } catch (err) {
                    window.alert(err instanceof Error ? err.message : String(err));
                  }
                })()
              }
            >
              {s.usesServerAssets ? "Удалить с сервера (как в коде)" : "Сбросить загрузку (как в коде)"}
            </button>
          ) : null}
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-card__title">Контактные данные</h2>
        <div className="admin-grid">
          <label className="admin-field">
            <span className="admin-label">Telegram (URL)</span>
            <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="admin-input" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Подпись Telegram в блоке контактов</span>
            <input
              value={telegramDisplay}
              onChange={(e) => setTelegramDisplay(e.target.value)}
              className="admin-input"
            />
          </label>
          <label className="admin-field">
            <span className="admin-label">ВКонтакте (URL)</span>
            <input value={vk} onChange={(e) => setVk(e.target.value)} className="admin-input" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Подпись ВК в блоке контактов</span>
            <input value={vkDisplay} onChange={(e) => setVkDisplay(e.target.value)} className="admin-input" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Телефон (href, например tel:+7…)</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="admin-input" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Телефон (как показывать)</span>
            <input value={phoneDisplay} onChange={(e) => setPhoneDisplay(e.target.value)} className="admin-input" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Email (href, mailto:…)</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="admin-input" />
          </label>
          <label className="admin-field">
            <span className="admin-label">Email (как показывать)</span>
            <input value={emailDisplay} onChange={(e) => setEmailDisplay(e.target.value)} className="admin-input" />
          </label>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" onClick={saveContacts}>
          Сохранить контакты
        </button>
        {savedContacts ? <span className="admin-saved"> Сохранено</span> : null}
      </section>
    </div>
  );
}
