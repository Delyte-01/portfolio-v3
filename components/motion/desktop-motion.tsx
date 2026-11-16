"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { DESKTOP_FINE, noop, type Cleanup } from "@/lib/motion";
import { initAbout } from "./micro/about";
import { initContact } from "./micro/contact";
import { initExperience } from "./micro/experience";
import { initExpertise } from "./micro/expertise";
import { initEyebrows } from "./micro/eyebrows";
import { initFooter } from "./micro/footer";
import { initMarquee } from "./micro/marquee";
import { initWorkCards } from "./micro/work-cards";

/**
 * Desktop-only micro-interaction layer, Selected Work to Contact (spec: gsap-animation.md).
 *
 * One `gsap.matchMedia()` under DESKTOP_FINE runs every `init*` below and collects their cleanups.
 * Phones, tablets, touch laptops and reduced-motion visitors never enter the callback, so they get
 * exactly the existing site: no listeners, no DOM work, no tweens. Crossing the 1024 px boundary (or
 * a strict-mode remount) runs every cleanup and leaves nothing behind.
 *
 * Order matters a little: each module reads the DOM *after* PageMotion has applied its hidden start
 * states, so DesktopMotion is mounted right after <PageMotion /> in app/page.tsx.
 */
/** A module that throws while setting up must not stop the others from running. */
const safe = (init: () => Cleanup): Cleanup => {
  try {
    return init();
  } catch (error) {
    console.error("[DesktopMotion] an effect failed to initialise", error);
    return noop;
  }
};

export function DesktopMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(DESKTOP_FINE, () => {
      const cleanups: Cleanup[] = [
        safe(initEyebrows),
        safe(initWorkCards),
        safe(initAbout),
        safe(initExpertise),
        safe(initExperience),
        safe(initMarquee),
        safe(initContact),
        safe(initFooter),
      ];
      return () => {
        // Reverse order: the last thing set up is the first thing undone.
        for (let i = cleanups.length - 1; i >= 0; i--) {
          try {
            cleanups[i]();
          } catch {
            /* one failing cleanup must never block the others */
          }
        }
      };
    });
    return () => mm.revert();
  }, []);
  return null;
}
