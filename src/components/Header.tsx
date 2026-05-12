import { useEffect, useId, useState } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";
import { Brand } from "./Brand";

export function Header() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const s = useSiteSettings();
  const { headerNav, presentation } = useSiteContent();
  const L = s.resolvedContacts;
  const automationExamplesHref = "/automation-examples.html";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header site-header--cyber">
      <div className="layout site-header__inner">
        <Brand variant="onDark" />
        <nav className="site-nav" aria-label="Основное меню">
          {headerNav.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
          <a className="site-nav__examples" href={automationExamplesHref}>
            Примеры автоматизации
          </a>
          {s.presentationEnabled ? (
            <a
              className="site-nav__presentation"
              href={s.presentationHref}
              download={s.presentationDownloadName}
            >
              {presentation.label}
            </a>
          ) : null}
        </nav>
        <div className="site-header__end">
          <div className="site-header__actions">
            <a className="btn btn--primary" href={L.phone}>
              {L.phoneDisplay}
            </a>
          </div>
          <a
            href="#/admin"
            className="site-header__admin"
            rel="nofollow"
            aria-label="Вход в панель администратора"
          >
            admin
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
            <span className="menu-toggle__bar" aria-hidden />
          </button>
        </div>
      </div>
      <div
        className={`layout mobile-drawer ${open ? "is-open" : ""}`}
        id={menuId}
        hidden={!open}
        role="navigation"
        aria-label="Мобильное меню"
      >
        {headerNav.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </a>
        ))}
        <a
          className="site-nav__examples site-nav__examples--drawer"
          href={automationExamplesHref}
          onClick={() => setOpen(false)}
        >
          Примеры автоматизации
        </a>
        {s.presentationEnabled ? (
          <a
            className="site-nav__presentation site-nav__presentation--drawer"
            href={s.presentationHref}
            download={s.presentationDownloadName}
            onClick={() => setOpen(false)}
          >
            {presentation.label}
          </a>
        ) : null}
        <a className="btn btn--primary" href={L.phone} onClick={() => setOpen(false)}>
          {L.phoneDisplay}
        </a>
        <a
          href="#/admin"
          className="site-header__admin site-header__admin--drawer"
          rel="nofollow"
          aria-label="Вход в панель администратора"
          onClick={() => setOpen(false)}
        >
          admin
        </a>
      </div>
    </header>
  );
}
