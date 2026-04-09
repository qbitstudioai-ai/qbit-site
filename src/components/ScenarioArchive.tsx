import { useEffect, useId, useState } from "react";
import type { Scenario, ScenarioFile } from "../content";
import { useSiteContent } from "../siteContent/useSiteContent";
import { usePrefersReducedMotion } from "../hooks/useMediaPreference";
import { SectionAmbientFx } from "./SectionAmbientFx";

const TYPE_STEP_MS = 9;

function ArchiveItem({
  scenario: s,
  expanded,
  onToggle,
  reduced,
}: {
  scenario: Scenario;
  expanded: boolean;
  onToggle: () => void;
  reduced: boolean;
}) {
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const files = s.files;

  const [typedBodies, setTypedBodies] = useState<[string, string, string]>(["", "", ""]);

  useEffect(() => {
    if (!expanded) {
      setTypedBodies(["", "", ""]);
      return;
    }
    if (reduced) {
      setTypedBodies([files[0].body, files[1].body, files[2].body]);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setTypedBodies(["", "", ""]);
      for (let i = 0; i < files.length; i++) {
        const body = files[i].body;
        for (let j = 1; j <= body.length; j++) {
          if (cancelled) return;
          const idx = i as 0 | 1 | 2;
          setTypedBodies((prev) => {
            const next: [string, string, string] = [...prev];
            next[idx] = body.slice(0, j);
            return next;
          });
          await new Promise((r) => setTimeout(r, TYPE_STEP_MS));
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [expanded, reduced, files]);

  const caretFileIndex = files.findIndex((f, i) => typedBodies[i].length < f.body.length);
  const showCaret = !reduced && expanded && caretFileIndex >= 0;

  return (
    <div className="archive-item-shell">
      <div className="archive-item">
        <button
          type="button"
          className="archive-item__head"
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span className="archive-item__index" aria-hidden>
            {s.id.padStart(2, "0")}
          </span>
          <span className="archive-item__title">{s.title}</span>
          <span className="archive-item__index" aria-hidden>
            {expanded ? "−" : "+"}
          </span>
        </button>
        <div
          id={panelId}
          className={`archive-item__panel-outer${expanded ? " archive-item__panel-outer--open" : ""}`}
          aria-hidden={!expanded}
        >
          <div className="archive-item__panel-inner">
            <div className="archive-item__panel" role="region" aria-label={s.title}>
              {files.map((f, i) => (
                <ArchiveFileBlock
                  key={f.label}
                  file={f}
                  typedBody={typedBodies[i]}
                  showCaret={showCaret && caretFileIndex === i}
                  bodyDescId={`${reactId}-body-${i}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchiveFileBlock({
  file,
  typedBody,
  showCaret,
  bodyDescId,
}: {
  file: ScenarioFile;
  typedBody: string;
  showCaret: boolean;
  bodyDescId: string;
}) {
  return (
    <div className="archive-file">
      <p className="archive-file__label">{file.label}</p>
      <p id={bodyDescId} className="sr-only">
        {file.body}
      </p>
      <p className="archive-file__body archive-file__body--fx" aria-hidden="true">
        {typedBody}
        {showCaret ? <span className="pain__title-caret" aria-hidden="true" /> : null}
      </p>
    </div>
  );
}

export function ScenarioArchive() {
  const [openId, setOpenId] = useState<string | null>(null);
  const reduced = usePrefersReducedMotion();
  const { archiveSection, scenarios } = useSiteContent();

  return (
    <section className="section pain-section section--has-ambient" id="kartoteka" aria-labelledby="archive-title">
      <SectionAmbientFx variant="orb" />
      <div className="layout">
        <h2 id="archive-title" className="section__title">
          {archiveSection.title}
        </h2>
        <p className="section__subtitle">{archiveSection.subtitle}</p>
        <div className="archive-list">
          {scenarios.map((s) => {
            const expanded = openId === s.id;
            return (
              <ArchiveItem
                key={s.id}
                scenario={s}
                expanded={expanded}
                reduced={reduced}
                onToggle={() => setOpenId(expanded ? null : s.id)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
