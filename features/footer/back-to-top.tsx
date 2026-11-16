"use client";

import { useRef } from "react";
import { useLenis } from "lenis/react";
import { ArrowUp } from "lucide-react";

import { gsap, useGSAP } from "@/lib/gsap";

const R = 21; // progress ring radius (viewBox 0 0 48 48)
const C = 2 * Math.PI * R;

/**
 * Floating back-to-top button (replaces the old footer link).
 * Hidden near the top; after one screen of scrolling it pops in with the custom "pop" ease, and a
 * ring around it fills with the page scroll progress. Scrolling up uses Lenis, so it glides with
 * the same easing as the rest of the site. Transform + opacity + stroke-dashoffset only.
 */
export function BackToTop() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const btn = btnRef.current;
      const ring = ringRef.current;
      if (!btn || !ring) return;

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      gsap.set(btn, { autoAlpha: 0, y: 18, scale: 0.7 });
      let shown = false;

      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        const progress = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
        ring.style.strokeDashoffset = String(C * (1 - progress));

        const show = y > window.innerHeight * 0.9;
        if (show === shown) return;
        shown = show;
        gsap.to(btn, {
          autoAlpha: show ? 1 : 0,
          y: show ? 0 : 18,
          scale: show ? 1 : 0.7,
          duration: reduced ? 0 : show ? 0.7 : 0.4,
          ease: show ? "pop" : "silk",
          overwrite: "auto",
        });
      };

      update();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      return () => {
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
      };
    },
    { scope: btnRef },
  );

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label="Back to top"
      onClick={() => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0 }))}
      style={{ visibility: "hidden", opacity: 0 }}
      className="group/top fixed bottom-5 right-5 z-[110] grid size-14 place-items-center rounded-full border-2 border-ink bg-white text-ink shadow-[3px_3px_0_0_var(--ink)] transition-[background-color,color,box-shadow] duration-300 hover:bg-[#D72B0C] hover:text-white hover:shadow-[5px_5px_0_0_var(--ink)] md:bottom-8 md:right-8"
    >
      <svg aria-hidden viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90">
        <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" />
        <circle
          ref={ringRef}
          cx="24"
          cy="24"
          r={R}
          fill="none"
          stroke="#D72B0C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C}
          className="group-hover/top:stroke-white"
        />
      </svg>
      <ArrowUp
        aria-hidden
        strokeWidth={2}
        className="relative size-5 transition-transform duration-300 ease-[var(--ease-atelier)] group-hover/top:-translate-y-1"
      />
    </button>
  );
}
