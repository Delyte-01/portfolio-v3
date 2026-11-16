import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cleanupBag, noop, qsa, type Cleanup } from "@/lib/motion";

/**
 * GLOBAL EXTRAS, F17: section numbers count up (spec: gsap-animation.md).
 * "01" to "05" in the eyebrows count from 00 once, 0.15 s after the existing slide-in starts.
 * The "+" index in the archive does not match the digits-only test and is left alone.
 */

const pad = (n: number) => String(n).padStart(2, "0");

export function initEyebrows(): Cleanup {
  const targets = qsa("[data-eyebrow]")
    .map((eyebrow) => eyebrow.firstElementChild as HTMLElement | null)
    .filter((el): el is HTMLElement => Boolean(el) && /^\d+$/.test(el?.textContent?.trim() ?? ""));
  if (!targets.length) return noop;

  const bag = cleanupBag();

  targets.forEach((span) => {
    const eyebrow = span.parentElement as HTMLElement;
    const finalText = span.textContent ?? "";
    const target = Number(finalText);

    // Already on screen: its own slide-in has played, so leave the final number alone.
    if (eyebrow.getBoundingClientRect().top <= window.innerHeight * 0.87) return;

    // Same digit widths all the way up, so the label next to it never shifts.
    span.style.fontVariantNumeric = "tabular-nums";
    span.textContent = pad(0);

    const counter = { n: 0 };
    const st = ScrollTrigger.create({
      trigger: eyebrow,
      start: "top 87%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          n: target,
          duration: 0.9,
          delay: 0.15,
          ease: "sleek",
          onUpdate: () => {
            span.textContent = pad(Math.round(counter.n));
          },
          onComplete: () => {
            span.textContent = finalText;
          },
        });
      },
    });

    bag.add(() => {
      st.kill();
      gsap.killTweensOf(counter);
      span.textContent = finalText;
      span.style.removeProperty("font-variant-numeric");
    });
  });

  return bag.run;
}
