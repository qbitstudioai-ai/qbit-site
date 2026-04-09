import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";
import { Brand } from "./Brand";

export function Footer() {
  const L = useSiteSettings().resolvedContacts;
  const { footer, nav } = useSiteContent();

  return (
    <footer className="site-footer cyber-bottom__footer">
      <div className="layout">
        <div className="site-footer__grid">
          <div>
            <Brand variant="onDark" />
            <p className="site-footer__tagline">{footer.tagline}</p>
          </div>
          <div>
            <p className="site-footer__col-title" id="footer-nav-heading">
              {footer.sectionsTitle}
            </p>
            <nav aria-labelledby="footer-nav-heading">
              <ul className="site-footer__list">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div>
            <p className="site-footer__col-title" id="footer-contacts-heading">
              {footer.contactsColumnTitle}
            </p>
            <nav aria-labelledby="footer-contacts-heading">
              <ul className="site-footer__list">
                <li>
                  <a href={L.telegram} target="_blank" rel="noreferrer">
                    {footer.linkTelegram}
                  </a>
                </li>
                <li>
                  <a href={L.vk} target="_blank" rel="noreferrer">
                    {footer.linkVk}
                  </a>
                </li>
                <li>
                  <a href={L.phone}>{L.phoneDisplay}</a>
                </li>
                <li>
                  <a href={L.email}>{L.emailDisplay}</a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <p className="site-footer__copy">{footer.copyright}</p>
      </div>
    </footer>
  );
}
