"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

// The first mount is the initial page load; only later mounts are navigations.
let hasNavigated = false;

/**
 * Re-mounts on every navigation (including back/forward). Plays a short wipe
 * that reveals the new page. useGSAP runs in a layout effect, so the cover is
 * in place before first paint and the page never flashes. Skipped for
 * reduced motion, and the panel is non-interactive so it can never trap input.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!hasNavigated) {
      hasNavigated = true;
      return;
    }
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        panel.current,
        { clipPath: "inset(0% 0% 0% 0%)", autoAlpha: 1 },
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 1,
          delay: 0.05,
          ease: "glide",
          onComplete: () => {
            gsap.set(panel.current, { autoAlpha: 0 });
          },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <>
      <div
        ref={panel}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[200] bg-charcoal"
        style={{ visibility: "hidden" }}
      />
      {children}
    </>
  );
}
