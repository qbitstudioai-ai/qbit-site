import { useState } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { usePrefersReducedMotion } from "../hooks/useMediaPreference";
import { ArchiveAccordionItem } from "./ArchiveAccordionItem";
import { SectionAmbientFx } from "./SectionAmbientFx";

export function DirectionsSection() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();
  const { directions } = useSiteContent();

  return (
    <section className="section pain-section section--has-ambient" id="napravleniya" aria-labelledby="dir-title">
      <SectionAmbientFx variant="orb-corner" />
      <div className="layout">
        <h2 id="dir-title" className="section__title">
          {directions.title}
        </h2>
        <p className="section__subtitle">{directions.subtitle}</p>
        <div className="archive-list">
          {directions.items.map((item, index) => {
            const key = item.title;
            const expanded = openKey === key;
            return (
              <ArchiveAccordionItem
                key={key}
                item={item}
                index={index}
                expanded={expanded}
                reduced={reduced}
                onToggle={() => setOpenKey(expanded ? null : key)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
