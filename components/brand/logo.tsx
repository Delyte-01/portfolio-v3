import { ICON, LETTERS, LOGO_BOX, LOGO_COLORS } from "./logo-parts";

type Variant = "brand" | "reversed" | "mono";

const WORD_FILL: Record<Variant, string> = {
  brand: LOGO_COLORS.word,
  /** For dark backgrounds: white wordmark, icon keeps its orange. */
  reversed: "#FFFFFF",
  mono: "currentColor",
};

/**
 * Full Delyte logo (icon + wordmark) as inline SVG. Decorative by itself: give the
 * wrapping link/element an accessible name. Size it with a height class (width follows).
 * The icon group carries `.logo-icon`, which turns 90 degrees on hover of a `.logo-link`
 * (the mark is 4-fold symmetric, so it lands on an identical shape). The wordmark group carries
 * `.logo-word` so the footer logo can move it separately.
 */
export function Logo({ className, variant = "brand" }: { className?: string; variant?: Variant }) {
  const b = LOGO_BOX.full;
  return (
    <svg
      className={className}
      viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className="logo-icon" fill={variant === "mono" ? "currentColor" : LOGO_COLORS.icon}>
        {ICON.map((p, i) => (
          <path key={i} d={p.d} transform={p.m} />
        ))}
      </g>
      <g className="logo-word" fill={WORD_FILL[variant]}>
        {LETTERS.map((p, i) => (
          <path key={i} d={p.d} transform={p.m} />
        ))}
      </g>
    </svg>
  );
}

/** The 8-petal mark on its own. `mono` uses the current text colour. */
export function LogoIcon({ className, mono = false }: { className?: string; mono?: boolean }) {
  const b = LOGO_BOX.icon;
  return (
    <svg
      className={className}
      viewBox={`${b.x} ${b.y} ${b.w} ${b.h}`}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill={mono ? "currentColor" : LOGO_COLORS.icon}>
        {ICON.map((p, i) => (
          <path key={i} d={p.d} transform={p.m} />
        ))}
      </g>
    </svg>
  );
}
