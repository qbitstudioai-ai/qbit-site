import { useEffect, useState } from "react";

function subscribeMedia(query: string, set: (m: boolean) => void) {
  const mq = window.matchMedia(query);
  set(mq.matches);
  const fn = () => set(mq.matches);
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => subscribeMedia("(prefers-reduced-motion: reduce)", setReduced), []);
  return reduced;
}

/** Устройства с нормальным hover (не только touch). */
export function usePrefersFineHover(): boolean {
  const [ok, setOk] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
  useEffect(() => subscribeMedia("(hover: hover) and (pointer: fine)", setOk), []);
  return ok;
}
