type BrandProps = {
  /** Светлый логотип для тёмной шапки */
  variant?: "onDark" | "onLight";
};

export function Brand({ variant = "onLight" }: BrandProps) {
  return (
    <a
      href="#top"
      className={`brand brand--${variant}`}
      aria-label="qbit studio-ai — на главную"
    >
      <img
        className="brand__logo"
        src="/logo.svg"
        alt=""
        decoding="async"
        fetchPriority="high"
        loading="eager"
      />
    </a>
  );
}
