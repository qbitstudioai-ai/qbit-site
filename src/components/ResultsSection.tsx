import { useSiteContent } from "../siteContent/useSiteContent";
import { SectionAmbientFx } from "./SectionAmbientFx";
import { SplitRailInteractiveCard } from "./SplitRailInteractiveCard";

export function ResultsSection() {
  const { businessResults } = useSiteContent();
  const gridItems = businessResults.items.filter((item) => !item.fullWidth);
  const fullWidthItem = businessResults.items.find((item) => item.fullWidth);

  return (
    <section className="section pain-section section--has-ambient" id="rezultat" aria-labelledby="results-title">
      <SectionAmbientFx variant="stripes-diag" />
      <div className="layout">
        <div className="pain__lead">
          <h2 id="results-title" className="section__title">
            {businessResults.title}
          </h2>
          <p className="section__intro pain__intro">{businessResults.intro}</p>
        </div>
        <div className="card-grid card-grid--2">
          {gridItems.map((item) => (
            <SplitRailInteractiveCard
              key={item.title}
              title={item.title}
              text={item.text}
              iconSrc={item.iconSrc}
            />
          ))}
        </div>
        {fullWidthItem ? (
          <div className="results-full-card">
            <SplitRailInteractiveCard
              title={fullWidthItem.title}
              text={fullWidthItem.text}
              iconSrc={fullWidthItem.iconSrc}
              trailingRail
              iconSrcRight={fullWidthItem.iconSrcRight}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
