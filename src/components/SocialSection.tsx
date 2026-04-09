import { useSiteContent } from "../siteContent/useSiteContent";
import { SectionAmbientFx } from "./SectionAmbientFx";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

const telegramCardIconSrc = "/telegram-card-icon.webp";
const vkCardIconSrc = "/vk-card-icon.webp";

export function SocialSection() {
  const L = useSiteSettings().resolvedContacts;
  const { social } = useSiteContent();

  return (
    <section className="section pain-section section--has-ambient" id="social" aria-labelledby="social-title">
      <SectionAmbientFx variant="cube" />
      <div className="layout">
        <h2 id="social-title" className="section__title">
          {social.title}
        </h2>
        <p className="section__intro">{social.text}</p>
        <div className="social-cards">
          <a className="social-card social-card--with-icon" href={L.telegram} target="_blank" rel="noreferrer">
            <div className="social-card__copy">
              <span className="social-card__name">{social.telegramLabel}</span>
              <p className="social-card__hint">{social.cardsHint}</p>
            </div>
            <div className="social-card__icon-wrap" aria-hidden="true">
              <img
                className="social-card__icon"
                src={telegramCardIconSrc}
                alt=""
                width={92}
                height={60}
                decoding="async"
                loading="lazy"
              />
            </div>
          </a>
          <a className="social-card social-card--with-icon" href={L.vk} target="_blank" rel="noreferrer">
            <div className="social-card__copy">
              <span className="social-card__name">{social.vkLabel}</span>
              <p className="social-card__hint">{social.cardsHint}</p>
            </div>
            <div className="social-card__icon-wrap" aria-hidden="true">
              <img
                className="social-card__icon"
                src={vkCardIconSrc}
                alt=""
                width={92}
                height={60}
                decoding="async"
                loading="lazy"
              />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
