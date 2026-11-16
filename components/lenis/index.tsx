"use client";

import { useEffect, useRef, useState } from "react";
import ReactLenis, { useLenis, type LenisRef } from "lenis/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Keeps ScrollTrigger in step with Lenis' virtual scroll position. */
function ScrollTriggerSync() {
  useLenis(() => {
    ScrollTrigger.update();
  });
  return null;
}

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  // Read once on the client. Not rendered, so no hydration mismatch.
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  // Single RAF loop: GSAP's ticker drives Lenis (recommended Lenis + GSAP setup).
  useEffect(() => {
    const update = (time: number) => {
      lenisRef.current?.lenis?.raf(time * 1000);
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        // Lower lerp = silkier, longer-trailing wheel scroll on desktop.
        lerp: 0.085,
        // Reduced motion: native wheel scrolling and near-instant programmatic scrolls.
        smoothWheel: !reduced,
        // Programmatic scrolls (nav links, back-to-top) use the shared "glide" easing.
        duration: reduced ? 0.01 : 1.4,
        easing: (t: number) => gsap.parseEase("glide")(t),
        // Touch devices keep native momentum scrolling (default syncTouch: false):
        // it is smoother and more familiar on phones than a JS-driven scroll.
        wheelMultiplier: 1,
      }}
    >
      <ScrollTriggerSync />
      {children}
    </ReactLenis>
  );
}
