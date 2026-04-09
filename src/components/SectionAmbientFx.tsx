export type SectionAmbientVariant =
  | "stripes"
  | "stripes-diag"
  | "stripes-soft"
  | "orb"
  | "orb-corner"
  | "cube"
  | "cube-iso"
  | "neural"
  | "halo";

type Props = {
  variant: SectionAmbientVariant;
};

/** Слабочитаемый фон: полосы / «сфера» / «куб» / сетка в лазурных тонах сайта. */
export function SectionAmbientFx({ variant }: Props) {
  return (
    <div className="section-ambient" aria-hidden="true">
      <div className={`section-ambient__layer section-ambient__layer--${variant}`} />
    </div>
  );
}
