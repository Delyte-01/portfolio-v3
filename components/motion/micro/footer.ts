import { gsap } from "@/lib/gsap";
import { cleanupBag, clamp, noop, on, onScrollFrame, rafCoalesce, type Cleanup } from "@/lib/motion";

/**
 * GLOBAL EXTRAS, F18: the footer logo reacts to the pointer (spec: gsap-animation.md).
 * Inside the footer only: the icon turns slowly toward the pointer and the wordmark leans after it.
 */

export function initFooter(): Cleanup {
  const footer = document.querySelector<HTMLElement>("footer");
  const logo = footer?.querySelector<HTMLElement>("[data-footer-logo]");
  const svg = logo?.querySelector<SVGSVGElement>("svg");
  const icon = logo?.querySelector<SVGGElement>(".logo-icon");
  const word = logo?.querySelector<SVGGElement>(".logo-word");
  if (!footer || !logo || !svg || !icon || !word) return noop;

  const bag = cleanupBag();

  gsap.set(icon, { transformOrigin: "50% 50%", transformBox: "fill-box" });

  // Follow smoothing is rebuilt on every visit: the return-to-rest tween below takes over the same
  // properties, and a fresh quickTo always starts from where the element actually is.
  let rotateTo = gsap.quickTo(icon, "rotation", { duration: 1.2, ease: "sleek" });
  let shiftTo = gsap.quickTo(word, "x", { duration: 1.2, ease: "sleek" });

  // The wordmark moves in SVG user units; convert so "8 px" really is about 8 screen pixels.
  let unitsPerPx = 1;
  let centreX = 0;
  const measure = () => {
    const r = logo.getBoundingClientRect();
    centreX = r.left + r.width / 2;
    const scale = svg.getScreenCTM()?.a;
    unitsPerPx = scale && scale > 0 ? 1 / scale : 1;
  };
  measure();

  let px = centreX;
  let inside = false;

  const apply = rafCoalesce(() => {
    rotateTo(clamp(-45, 45, (px - centreX) / 12));
    shiftTo(clamp(-8, 8, (px - centreX) / 40) * unitsPerPx);
  });

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    if (!inside) {
      inside = true;
      // Nothing is running yet; make sure nothing from the last visit's return tween is either.
      gsap.killTweensOf(icon, "rotation");
      gsap.killTweensOf(word, "x");
      rotateTo = gsap.quickTo(icon, "rotation", { duration: 1.2, ease: "sleek" });
      shiftTo = gsap.quickTo(word, "x", { duration: 1.2, ease: "sleek" });
      measure();
    }
    px = e.clientX;
    apply();
  };

  const onLeave = () => {
    inside = false;
    apply.cancel();
    gsap.killTweensOf(icon, "rotation");
    gsap.killTweensOf(word, "x");
    gsap.to(icon, { rotation: 0, duration: 1.2, ease: "sleekSpring", overwrite: "auto" });
    gsap.to(word, { x: 0, duration: 1.2, ease: "sleekSpring", overwrite: "auto" });
  };

  bag.add(on<PointerEvent>(footer, "pointermove", onMove, { passive: true }));
  bag.add(on(footer, "pointerleave", onLeave));
  // The page scrolls under a still pointer: keep the logo's centre fresh.
  bag.add(
    onScrollFrame(() => {
      if (inside) measure();
    }),
  );
  bag.add(() => apply.cancel());
  bag.add(() => {
    gsap.killTweensOf([icon, word]);
    gsap.set([icon, word], { clearProps: "transform" });
  });
  return bag.run;
}
