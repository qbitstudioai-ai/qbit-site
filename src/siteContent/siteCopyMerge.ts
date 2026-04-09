/** Глубокое слияние: patch поверх base (объекты рекурсивно; массивы — по индексам для объектов). */
export function deepMergeSiteCopy<T>(base: T, patch: unknown): T {
  if (patch === undefined || patch === null) return base;
  if (typeof patch !== "object") return patch as T;
  if (Array.isArray(patch)) {
    if (!Array.isArray(base)) return patch as T;
    return patch.map((p, i) => {
      const b = (base as unknown[])[i];
      if (
        b !== undefined &&
        p !== undefined &&
        typeof b === "object" &&
        typeof p === "object" &&
        !Array.isArray(b) &&
        !Array.isArray(p)
      ) {
        return deepMergeSiteCopy(b, p);
      }
      return p;
    }) as T;
  }
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    return patch as T;
  }
  const out = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(patch as object)) {
    if (!(k in out)) continue;
    out[k] = deepMergeSiteCopy(out[k], (patch as Record<string, unknown>)[k]);
  }
  return out as T;
}

/** Минимальный JSON для хранения: только отличающиеся от defaults ветки. */
export function diffSiteCopyPayload(defaults: unknown, current: unknown): Record<string, unknown> {
  const d = diffPartial(defaults, current);
  return (typeof d === "object" && d !== null && !Array.isArray(d) ? d : {}) as Record<string, unknown>;
}

function diffPartial(def: unknown, cur: unknown): unknown {
  if (def === cur) return undefined;
  if (typeof def !== "object" || def === null || typeof cur !== "object" || cur === null) {
    return cur;
  }
  if (Array.isArray(def) && Array.isArray(cur)) {
    if (def.length !== cur.length) return cur;
    for (let i = 0; i < cur.length; i++) {
      if (JSON.stringify(def[i]) !== JSON.stringify(cur[i])) return cur;
    }
    return undefined;
  }
  if (Array.isArray(def) || Array.isArray(cur)) return cur;
  const obj: Record<string, unknown> = {};
  let has = false;
  for (const k of Object.keys(def as Record<string, unknown>)) {
    if (!Object.prototype.hasOwnProperty.call(cur, k)) continue;
    const sub = diffPartial(
      (def as Record<string, unknown>)[k],
      (cur as Record<string, unknown>)[k],
    );
    if (sub !== undefined) {
      obj[k] = sub;
      has = true;
    }
  }
  return has ? obj : undefined;
}
