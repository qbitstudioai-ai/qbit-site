import { useEffect, useState } from "react";
import type { SiteCopy } from "../siteContent/defaultSiteCopy";
import { useSiteContent } from "../siteContent/useSiteContent";
import { usePrefersReducedMotion } from "../hooks/useMediaPreference";
import { SectionAmbientFx } from "./SectionAmbientFx";
import { SplitRailInteractiveCard } from "./SplitRailInteractiveCard";

function PainTitleTypewriter({ pain }: { pain: SiteCopy["pain"] }) {
  const reduced = usePrefersReducedMotion();
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [done, setDone] = useState(false);

  const showLine1 = reduced ? pain.titleLine1 : line1;
  const showLine2 = reduced ? pain.titleLine2 : line2;
  const showDone = reduced || done;

  useEffect(() => {
    if (reduced) return;

    let cancelled = false;
    const charMs = 36;
    const pauseMs = 300;

    const run = async () => {
      await undefined;
      if (cancelled) return;
      setLine1("");
      setLine2("");
      setDone(false);
      for (let i = 1; i <= pain.titleLine1.length; i++) {
        if (cancelled) return;
        setLine1(pain.titleLine1.slice(0, i));
        await new Promise((r) => setTimeout(r, charMs));
      }
      await new Promise((r) => setTimeout(r, pauseMs));
      for (let i = 1; i <= pain.titleLine2.length; i++) {
        if (cancelled) return;
        setLine2(pain.titleLine2.slice(0, i));
        await new Promise((r) => setTimeout(r, charMs));
      }
      if (!cancelled) setDone(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [reduced, pain.titleLine1, pain.titleLine2]);

  const fullLabel = `${pain.titleLine1} ${pain.titleLine2}`;

  return (
    <h2 id="pain-title" className="section__title pain__title pain__title--type" aria-label={fullLabel}>
      <span className="pain__title-line">
        {showLine1}
        {!showDone && showLine2.length === 0 ? <span className="pain__title-caret" aria-hidden="true" /> : null}
      </span>
      <span className="pain__title-line">
        {showLine2}
        {!showDone && showLine2.length > 0 ? <span className="pain__title-caret" aria-hidden="true" /> : null}
      </span>
    </h2>
  );
}

export function PainSection() {
  const { pain } = useSiteContent();
  return (
    <section className="section pain-section section--has-ambient" id="bol" aria-labelledby="pain-title">
      <SectionAmbientFx variant="stripes" />
      <div className="layout">
        <div className="pain__lead">
          <PainTitleTypewriter pain={pain} />
          <p className="section__intro pain__intro">{pain.intro}</p>
        </div>
        <div className="card-grid card-grid--2">
          {pain.cards.map((c) => (
            <SplitRailInteractiveCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
