import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";
import { SectionAmbientFx } from "./SectionAmbientFx";

export function FinalCTASection() {
  const L = useSiteSettings().resolvedContacts;
  const { finalCta } = useSiteContent();
  const cards = finalCta.cards.map((card, i) => {
    if (i === 1) return { ...card, href: L.phone };
    return card;
  });

  return (
    <section className="section pain-section section--has-ambient" id="cta" aria-labelledby="cta-title">
      <SectionAmbientFx variant="halo" />
      <div className="layout">
        <h2 id="cta-title" className="section__title">
          {finalCta.title}
        </h2>
        <p className="section__intro">{finalCta.intro}</p>
        <div className="social-cards">
          {cards.map((card) => {
            const isExternal = card.href.startsWith("http");
            return (
              <a
                key={card.label}
                className="social-card social-card--with-icon"
                href={card.href}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <div className="social-card__copy">
                  <span className="social-card__name">{card.label}</span>
                </div>
                <div className="social-card__icon-wrap" aria-hidden="true">
                  {"iconSrc" in card && card.iconSrc ? (
                    <img
                      className="social-card__icon"
                      src={card.iconSrc}
                      alt=""
                      width={92}
                      height={60}
                      decoding="async"
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
