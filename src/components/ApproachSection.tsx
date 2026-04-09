import { useState } from "react";
import { useSiteContent } from "../siteContent/useSiteContent";
import { usePrefersReducedMotion } from "../hooks/useMediaPreference";
import { ArchiveAccordionItem } from "./ArchiveAccordionItem";
import { SectionAmbientFx } from "./SectionAmbientFx";

export function ApproachSection() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();
  const { approach } = useSiteContent();

  return (
    <section className="section pain-section section--has-ambient" id="podhod" aria-labelledby="approach-title">
      <SectionAmbientFx variant="cube-iso" />
      <div className="layout">
        <h2 id="approach-title" className="section__title">
          {approach.title}
        </h2>
        <p className="section__subtitle">{approach.subtitle}</p>
        <div className="archive-list">
          {approach.steps.map((step, index) => {
            const key = step.title;
            const expanded = openKey === key;
            return (
              <ArchiveAccordionItem
                key={key}
                item={step}
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
