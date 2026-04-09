import { useEffect, useId, useState, type FocusEvent } from "react";
import { usePrefersFineHover, usePrefersReducedMotion } from "../hooks/useMediaPreference";

export type SplitRailCardProps = {
  title: string;
  text: string;
  iconSrc?: string;
  /** Колонка справа 20% под вторую иконку (как слева) */
  trailingRail?: boolean;
  iconSrcRight?: string;
};

function TrailingIconRail({ iconSrc }: { iconSrc?: string }) {
  return (
    <div className="card__icon-rail card__icon-rail--end" aria-hidden="true">
      {iconSrc ? (
        <img
          className="card__icon-rail-img"
          src={iconSrc}
          alt=""
          width={96}
          height={96}
          decoding="async"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}

export function SplitRailInteractiveCard({
  title,
  text,
  iconSrc,
  trailingRail,
  iconSrcRight,
}: SplitRailCardProps) {
  const showEndRail = trailingRail || Boolean(iconSrcRight);
  const splitRailClass = `card card--split-rail${showEndRail ? " card--split-rail-dual" : ""}`;
  const reduced = usePrefersReducedMotion();
  const canHover = usePrefersFineHover();
  const staticMode = reduced || !canHover;
  const reactId = useId();
  const titleId = `${reactId}-title`;
  const descId = `${reactId}-desc`;

  const [active, setActive] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (staticMode || !active) {
      return;
    }
    let i = 0;
    const stepMs = 9;
    const tick = window.setInterval(() => {
      i += 1;
      setTyped(text.slice(0, Math.min(i, text.length)));
      if (i >= text.length) window.clearInterval(tick);
    }, stepMs);
    return () => window.clearInterval(tick);
  }, [active, text, staticMode]);

  const handleBlur = (e: FocusEvent<HTMLElement>) => {
    const next = e.relatedTarget;
    if (next instanceof Node && e.currentTarget.contains(next)) return;
    setActive(false);
    setTyped("");
  };

  if (staticMode) {
    return (
      <article className={`${splitRailClass} pain-card pain-card--static`}>
        <div className="card__icon-rail" aria-hidden="true">
          {iconSrc ? (
            <img
              className="card__icon-rail-img"
              src={iconSrc}
              alt=""
              width={96}
              height={96}
              decoding="async"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="card__main">
          <h3 className="card__title" id={titleId}>
            {title}
          </h3>
          <p className="card__text" id={descId}>
            {text}
          </p>
        </div>
        {showEndRail ? <TrailingIconRail iconSrc={iconSrcRight} /> : null}
      </article>
    );
  }

  return (
    <article
      className={`${splitRailClass} pain-card`}
      tabIndex={0}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={(e) => {
        if (e.currentTarget.contains(document.activeElement)) return;
        setActive(false);
        setTyped("");
      }}
      onFocus={() => setActive(true)}
      onBlur={handleBlur}
    >
      <div className="card__icon-rail" aria-hidden="true">
        {iconSrc ? (
          <img
            className="card__icon-rail-img"
            src={iconSrc}
            alt=""
            width={96}
            height={96}
            decoding="async"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="card__main">
        <h3 className="card__title" id={titleId}>
          {title}
        </h3>
        <p id={descId} className="sr-only">
          {text}
        </p>
        <p className="card__text pain-card__fx-text" aria-hidden="true">
          {active ? typed : ""}
        </p>
      </div>
      {showEndRail ? <TrailingIconRail iconSrc={iconSrcRight} /> : null}
    </article>
  );
}
