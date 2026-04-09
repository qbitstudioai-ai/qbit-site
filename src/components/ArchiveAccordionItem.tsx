import { useEffect, useId, useState } from "react";

const TYPE_STEP_MS = 9;

export type ArchiveAccordionTextItem = {
  title: string;
  text: string;
};

type Props = {
  item: ArchiveAccordionTextItem;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  reduced: boolean;
};

export function ArchiveAccordionItem({ item, index, expanded, onToggle, reduced }: Props) {
  const reactId = useId();
  const panelId = `${reactId}-panel`;
  const bodyDescId = `${reactId}-body`;
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!expanded) {
      queueMicrotask(() => setTyped(""));
      return;
    }
    if (reduced) {
      queueMicrotask(() => setTyped(item.text));
      return;
    }
    let i = 0;
    const body = item.text;
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(body.slice(0, Math.min(i, body.length)));
      if (i >= body.length) window.clearInterval(tick);
    }, TYPE_STEP_MS);
    return () => window.clearInterval(tick);
  }, [expanded, reduced, item.text]);

  const showCaret = !reduced && expanded && typed.length < item.text.length;
  const num = String(index + 1).padStart(2, "0");

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
            {num}
          </span>
          <span className="archive-item__title">{item.title}</span>
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
            <div className="archive-item__panel" role="region" aria-label={item.title}>
              <div className="archive-file">
                <p id={bodyDescId} className="sr-only">
                  {item.text}
                </p>
                <p className="archive-file__body archive-file__body--fx" aria-hidden="true">
                  {typed}
                  {showCaret ? <span className="pain__title-caret" aria-hidden="true" /> : null}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
