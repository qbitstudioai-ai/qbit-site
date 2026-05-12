import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

export function ContactsSection() {
  const L = useSiteSettings().resolvedContacts;
  const { contacts } = useSiteContent();

  return (
    <section className="section cyber-bottom__section" id="kontakty" aria-labelledby="contacts-title">
      <div className="layout">
        <h2 id="contacts-title" className="section__title">
          {contacts.title}
        </h2>
        <p className="section__subtitle">{contacts.subtitle}</p>
        <div className="contacts-list-wrap">
          <ul className="contact-block">
            <li className="contact-block__item">
              <h3>{contacts.headingTelegram}</h3>
              <p>
                <a href={L.telegram} target="_blank" rel="noopener noreferrer">
                  {L.telegramDisplay}
                </a>
              </p>
            </li>
            <li className="contact-block__item">
              <h3>{contacts.headingPhone}</h3>
              <p>
                <a href={L.phone}>{L.phoneDisplay}</a>
              </p>
            </li>
            <li className="contact-block__item">
              <h3>{contacts.headingVk}</h3>
              <p>
                <a href={L.vk} target="_blank" rel="noopener noreferrer">
                  {L.vkDisplay}
                </a>
              </p>
            </li>
            <li className="contact-block__item">
              <h3>{contacts.headingEmail}</h3>
              <p>
                <a href={L.email}>{L.emailDisplay}</a>
              </p>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

