/**
 * Inline version of the Delyte logo (from public/brand/delyte-logo.svg).
 *
 * Why inline: GSAP needs to reach each piece. All nested Fabric.js transforms were
 * flattened into one matrix per path, and the invisible helper <text> node was dropped.
 *
 * Parts (queried by the loader via data-part):
 *   icon / icon-piece  the 8 petals of the mark, in the SVG's original order
 *   letter             d, e, l, y, t, e in reading order (data-i = 0..5)
 *   rule               hairline under the wordmark
 *
 * Colours are kept exactly as in the original file (icon #FF6A3D, wordmark #D72B0C).
 */

import { ICON, LETTERS } from "@/components/brand/logo-parts";

/** Geometry used by the loader timeline (SVG user units). */
export const LOGO = {
  viewBox: "106.8 267.7 732.2 252.3",
  /** Height of the clip window the letters rise through (includes room for the "y" descender). */
  clipH: 206,
} as const;

const CLIP_ID = "delyte-letters-clip";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox={LOGO.viewBox}
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Window the letters rise through. +25% at the bottom so the "y" is never cut. */}
        <clipPath id={CLIP_ID}>
          <rect x="360" y="296" width="490" height={LOGO.clipH} />
        </clipPath>
      </defs>

      <g data-part="icon" fill="#FF6A3D">
        {ICON.map((p, i) => (
          <g key={i} data-part="icon-piece">
            <path d={p.d} transform={p.m} />
          </g>
        ))}
      </g>

      <g clipPath={`url(#${CLIP_ID})`} fill="#D72B0C">
        {LETTERS.map((p, i) => (
          <g key={i} data-part="letter" data-i={i}>
            <path d={p.d} transform={p.m} />
          </g>
        ))}
      </g>

      <rect data-part="rule" x="368.7" y="512" width="462.3" height="2" rx="1" fill="#D72B0C" />
    </svg>
  );
}
