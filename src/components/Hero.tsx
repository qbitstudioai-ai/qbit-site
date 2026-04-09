import { useSiteContent } from "../siteContent/useSiteContent";
import { useSiteSettings } from "../siteSettings/SiteSettingsContext";

const dashboardSrc = "/hero-dashboard.png";

export function Hero() {
  const s = useSiteSettings();
  const { hero, telegramDirectHref } = useSiteContent();

  return (
    <section className="hero" id="top" tabIndex={-1} aria-labelledby="hero-title">
      <div className="layout hero__grid">
        <div className="hero__copy">
          <p className="hero__kicker">{hero.kicker}</p>
          <h1 id="hero-title" className="hero__title">
            {hero.title}
          </h1>
          <p className="hero__subtitle">{hero.subtitle}</p>
          <div className="btn-row">
            <a className="btn btn--primary" href={telegramDirectHref} target="_blank" rel="noreferrer">
              {hero.ctaTelegramLabel}
            </a>
            <a className="btn" href={s.presentationHref} download={s.presentationDownloadName}>
              {hero.ctaPresentationLabel}
            </a>
          </div>
          <p className="hero__trust">{hero.trustLine}</p>
        </div>
        <div className="hero__visual">
          <div className="hero__dashboard-wrap">
            <img
              className="hero__dashboard"
              src={dashboardSrc}
              width={1200}
              height={675}
              alt={hero.dashboardImageAlt}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="hero__dashboard-fx" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
