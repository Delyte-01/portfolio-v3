"use client";

/**
 * Step caption under the hero copy: "Designing the mark → Building the page → Shipping".
 * Desktop only. It is invisible until the browser stage sends its first `step` signal, so phones and
 * reduced-motion visitors (where the stage never loops) never see it.
 */

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { HERO_STEP_EVENT, HERO_STEPS, type HeroSignal } from "./hero-events";

const R = 9;
const C = 2 * Math.PI * R;

export function HeroSteps() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const root = rootRef.current;
    if (!root) return;
    const label = root.querySelector<HTMLElement>("[data-step-label]");
    const count = root.querySelector<HTMLElement>("[data-step-count]");
    const ring = root.querySelector<SVGCircleElement>("[data-step-ring]");
    if (!label || !count || !ring) return;

    let ringTween: gsap.core.Tween | null = null;
    let swap: gsap.core.Timeline | null = null;
    let current = -1;
    let shown = false;

    const onSignal = (e: Event) => {
      const d = (e as CustomEvent<HeroSignal>).detail;
      if (!d) return;
      if (d.type === "pause") {
        ringTween?.paused(d.paused);
        return;
      }
      if (!shown) {
        shown = true;
        gsap.to(root, { autoAlpha: 1, duration: 0.6, ease: "silk" });
      }
      const text = HERO_STEPS[d.step] ?? "";
      const num = String(d.step + 1).padStart(2, "0");

      // Ring: refills over the length of the step.
      ringTween?.kill();
      gsap.set(ring, { strokeDashoffset: C });
      ringTween = gsap.to(ring, { strokeDashoffset: 0, duration: d.duration, ease: "none" });

      if (d.step === current) return;
      const first = current === -1;
      current = d.step;
      swap?.kill();
      if (first) {
        label.textContent = text;
        count.textContent = num;
        return;
      }
      // Roll the label out through its mask and the new one in from below.
      swap = gsap
        .timeline()
        .to(label, { yPercent: -110, duration: 0.28, ease: "power3.in" })
        .call(() => {
          label.textContent = text;
          count.textContent = num;
        })
        .fromTo(label, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: "silk" });
    };

    window.addEventListener(HERO_STEP_EVENT, onSignal);
    return () => {
      window.removeEventListener(HERO_STEP_EVENT, onSignal);
      ringTween?.kill();
      swap?.kill();
    };
  });

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="mt-9 hidden items-center gap-3 text-muted-ink opacity-0 lg:flex"
    >
      <svg width="26" height="26" viewBox="0 0 24 24" className="-rotate-90 shrink-0" focusable="false">
        <circle cx="12" cy="12" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
        <circle
          data-step-ring
          cx="12"
          cy="12"
          r={R}
          fill="none"
          stroke="var(--electric)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
        />
      </svg>
      <span data-step-count className="t-meta tabular-nums text-ink">
        01
      </span>
      <span className="relative block h-[1.4em] overflow-hidden">
        <span data-step-label className="t-meta block whitespace-nowrap">
          {HERO_STEPS[0]}
        </span>
      </span>
    </div>
  );
}
