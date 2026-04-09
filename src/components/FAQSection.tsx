import { useId } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { SectionAmbientFx } from "./SectionAmbientFx";

export function FAQSection() {
  const baseId = useId();
  const { faq } = useSiteContent();

  return (
    <section className="section pain-section section--has-ambient" id="faq" aria-labelledby="faq-title">
      <SectionAmbientFx variant="stripes-soft" />
      <div className="layout">
        <div className="pain__lead">
          <h2 id="faq-title" className="section__title">
            {faq.title}
          </h2>
        </div>
        <div className="faq-split-list">
          {faq.items.map((item, i) => {
            const qId = `${baseId}-q-${i}`;
            return (
              <div key={item.q} className="faq-split-row" role="group" aria-labelledby={qId}>
                <div className="faq-split-row__pair">
                  <article className="faq-split-card faq-split-card--q" tabIndex={0}>
                    <div className="faq-split-card__rail" aria-hidden="true">
                      {faq.questionIconSrc ? (
                        <img
                          className="faq-split-card__rail-img"
                          src={faq.questionIconSrc}
                          alt=""
                          width={96}
                          height={96}
                          decoding="async"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="faq-split-card__main">
                      <h3 id={qId} className="faq-split-card__q">
                        {item.q}
                      </h3>
                    </div>
                  </article>
                  <article className="faq-split-card faq-split-card--a" aria-label="Ответ">
                    <div className="faq-split-card__rail" aria-hidden="true">
                      {faq.answerIconSrc ? (
                        <img
                          className="faq-split-card__rail-img"
                          src={faq.answerIconSrc}
                          alt=""
                          width={96}
                          height={96}
                          decoding="async"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="faq-split-card__main">
                      <p className="faq-split-card__a">{item.a}</p>
                    </div>
                  </article>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
