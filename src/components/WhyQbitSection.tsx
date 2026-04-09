import { useSiteContent } from "../siteContent/useSiteContent";
import { SectionAmbientFx } from "./SectionAmbientFx";
import { SplitRailInteractiveCard } from "./SplitRailInteractiveCard";

export function WhyQbitSection() {
  const { whyQbit } = useSiteContent();
  return (
    <section className="section pain-section section--has-ambient" id="pochemu" aria-labelledby="why-title">
      <SectionAmbientFx variant="neural" />
      <div className="layout">
        <div className="pain__lead">
          <h2 id="why-title" className="section__title">
            {whyQbit.title}
          </h2>
          <p className="section__intro pain__intro">{whyQbit.intro}</p>
        </div>
        <div className="card-grid card-grid--2">
          {whyQbit.items.map((item) => (
            <SplitRailInteractiveCard
              key={item.title}
              title={item.title}
              text={item.text}
              iconSrc={item.iconSrc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
