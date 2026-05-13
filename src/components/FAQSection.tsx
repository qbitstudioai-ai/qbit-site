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
        <div className="faq-list">
          {faq.items.map((item, i) => {
            const qId = `${baseId}-q-${i}`;
            return (
              <details key={`${i}-${item.q}`} className="faq-item">
                <summary className="faq-item__summary">
                  <span className="faq-item__summary-inner">
                    <span className="faq-item__q-rail" aria-hidden="true">
                      {faq.questionIconSrc ? (
                        <img
                          className="faq-item__rail-img"
                          src={faq.questionIconSrc}
                          alt=""
                          width={96}
                          height={96}
                          decoding="async"
                          loading={i === 0 ? "eager" : "lazy"}
                        />
                      ) : null}
                    </span>
                    <span className="faq-item__q-wrap">
                      <h3 id={qId} className="faq-item__q">
                        {item.q}
                      </h3>
                    </span>
                  </span>
                  <span aria-hidden="true" className="faq-item__toggle" />
                </summary>
                <div className="faq-item__panel-outer">
                  <div className="faq-item__panel-inner">
                    <div className="faq-item__panel" role="region" aria-labelledby={qId}>
                      <div className="faq-item__answer">
                        <div className="faq-item__a-rail" aria-hidden="true">
                          {faq.answerIconSrc ? (
                            <img
                              className="faq-item__rail-img"
                              src={faq.answerIconSrc}
                              alt=""
                              width={96}
                              height={96}
                              decoding="async"
                              loading="lazy"
                            />
                          ) : null}
                        </div>
                        <p className="faq-item__a">{item.a}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
