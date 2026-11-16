import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cleanupBag, noop, qsa, on, type Cleanup } from "@/lib/motion";

/**
 * MARQUEE BANDS, direction flip and hover slowdown (spec: gsap-animation.md F13).
 *
 * The bands are CSS-animated in the markup (and stay that way on phones and tablets). On desktop
 * each band is taken over by one GSAP tween so it can reverse with the scroll direction, speed up
 * with scroll speed, slow to 25 % on hover and pause off-screen. Negative `playbackRate` on an
 * infinite CSS animation is unreliable, which is why the old WAAPI rate controller in
 * page-motion.tsx stands down while this is active.
 */

const HOVER_RATE = 0.25;
/**
 * A repeating tween cannot run backwards past time 0 (it would just stop). Starting every band a few
 * hundred loops in gives the reverse direction effectively unlimited headroom.
 */
const SEED_LOOPS = 400;

interface Band {
  el: HTMLElement;
  uls: HTMLElement[];
  tween: gsap.core.Tween;
  rate: { v: number };
  to: (v: number) => void;
  base: number;
}

export function initMarquee(): Cleanup {
  const els = qsa(".marquee");
  if (!els.length) return noop;

  const bag = cleanupBag();
  const bands: Band[] = [];

  els.forEach((el) => {
    const uls = qsa<HTMLElement>(":scope > ul", el);
    const first = uls[0];
    if (!first) return;

    // 1. Read the loop duration and direction the markup already carries.
    const duration = parseFloat(first.style.animationDuration) || 40;
    const reverse = first.style.animationDirection === "reverse";

    // Keep the band where the CSS animation currently is, so taking over does not visibly jump.
    const current = first.getAnimations()[0]?.currentTime;
    const elapsed = typeof current === "number" ? current / 1000 : 0;
    const progress = (((elapsed % duration) + duration) % duration) / duration;

    // 2. Stop the CSS animation (animation-name only: duration and direction stay on the element).
    uls.forEach((ul) => (ul.style.animationName = "none"));

    // 3. One tween drives both tracks.
    if (reverse) gsap.set(uls, { xPercent: -100 });
    const tween = gsap.to(uls, { xPercent: reverse ? 0 : -100, duration, ease: "none", repeat: -1 });
    tween.totalTime(duration * SEED_LOOPS + progress * duration);

    // 4. Smoothed speed. A plain proxy object keeps this independent of how a tween exposes timeScale.
    const rate = { v: 1 };
    const to = gsap.quickTo(rate, "v", {
      duration: 0.8,
      ease: "sleek",
      onUpdate: () => {
        tween.timeScale(rate.v);
      },
    });

    const band: Band = { el, uls, tween, rate, to, base: 1 };
    bands.push(band);

    // 6. Hover slows the band to 25 %.
    bag.add(
      on(el, "pointerenter", () => {
        band.base = HOVER_RATE;
        band.to(HOVER_RATE);
      }),
    );
    bag.add(
      on(el, "pointerleave", () => {
        band.base = 1;
        band.to(1);
      }),
    );

    // 7. Off-screen bands do not run.
    const visible = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => tween.paused(!self.isActive),
    });
    tween.paused(!visible.isActive);

    bag.add(() => {
      // 8. Hand the band back to CSS.
      visible.kill();
      tween.kill();
      gsap.killTweensOf(rate);
      gsap.set(uls, { clearProps: "transform" });
      uls.forEach((ul) => (ul.style.animationName = ""));
    });
  });

  if (!bands.length) return bag.run;

  // 5. Scroll speed and direction, one shared trigger for every band.
  const scroll = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 900, 1.6);
      const dir = self.direction === -1 ? -1 : 1;
      bands.forEach((b) => b.to(b.base * boost * dir));
    },
  });
  const settle = () => bands.forEach((b) => b.to(b.base));
  ScrollTrigger.addEventListener("scrollEnd", settle);

  bag.add(() => {
    scroll.kill();
    ScrollTrigger.removeEventListener("scrollEnd", settle);
  });
  return bag.run;
}
