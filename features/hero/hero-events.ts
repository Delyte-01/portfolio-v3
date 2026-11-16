/**
 * The one-way signal channel between the browser stage (right) and the left-hand hero pieces.
 * The stage only ever DISPATCHES; the caption and the scribble only ever LISTEN. Neither imports
 * the other, so either side can be removed without touching the rest.
 */
export const HERO_STEP_EVENT = "delyte:hero-step";

export const HERO_STEPS = ["Designing the mark", "Building the page", "Shipping"] as const;

export type HeroSignal =
  | { type: "step"; step: number; duration: number }
  | { type: "pause"; paused: boolean };

export function emitHero(detail: HeroSignal) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<HeroSignal>(HERO_STEP_EVENT, { detail }));
}
