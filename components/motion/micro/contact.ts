import { gsap, SplitText } from "@/lib/gsap";
import { cleanupBag, noop, on, qsa, trackHover, type Cleanup } from "@/lib/motion";

/**
 * CONTACT (spec: gsap-animation.md)
 *   F14  cursor-following glow on the card
 *   F15  email letter flip + gentle magnet (the magnet itself is the data-magnetic strength
 *        override in page-motion.tsx)
 *   F16  the dot burst for the copy button (the button is features/contact/copy-email.tsx and works
 *        on every device; only this burst is desktop-gated)
 */

// ── F14 ───────────────────────────────────────────────────────────────────

function initGlow(): Cleanup {
  const card = document.querySelector<HTMLElement>("[data-contact-card]");
  const surface = card?.querySelector<HTMLElement>("[data-contact-surface]");
  const glow = card?.querySelector<HTMLElement>("[data-contact-glow]");
  if (!card || !surface || !glow) return noop;

  let rect = card.getBoundingClientRect();
  const place = (x: number, y: number) => {
    glow.style.setProperty("--mx", `${x - rect.left}px`);
    glow.style.setProperty("--my", `${y - rect.top}px`);
  };

  const stop = trackHover<HTMLElement>(surface, {
    find: () => surface,
    enter: (_el, x, y) => {
      rect = card.getBoundingClientRect();
      place(x, y);
      gsap.to(glow, { autoAlpha: 1, duration: 0.5, ease: "sleek", overwrite: "auto" });
    },
    move: (_el, x, y) => place(x, y),
    scroll: () => {
      rect = card.getBoundingClientRect();
    },
    leave: () => {
      gsap.to(glow, { autoAlpha: 0, duration: 0.5, ease: "sleekOut", overwrite: "auto" });
    },
  });

  return () => {
    stop();
    gsap.killTweensOf(glow);
    gsap.set(glow, { clearProps: "opacity,visibility" });
    glow.style.removeProperty("--mx");
    glow.style.removeProperty("--my");
  };
}

// ── F15 ───────────────────────────────────────────────────────────────────

function initEmailFlip(): Cleanup {
  const links = qsa<HTMLElement>("[data-contact-card] a[data-split-hover]");
  if (!links.length) return noop;

  const bag = cleanupBag();

  links.forEach((a) => {
    let split: SplitText | null = null;
    let chars: Element[] = [];

    // Perspective is applied here, not in the markup, so non-desktop devices never see it.
    a.style.perspective = "600px";

    const flip = () => {
      if (!split) {
        split = SplitText.create(a, { type: "words,chars", wordsClass: "split-word", charsClass: "split-char" });
        chars = split.chars as Element[];
      }
      gsap.fromTo(
        chars,
        { rotationX: -90, autoAlpha: 0.2, transformOrigin: "50% 50% -0.4em" },
        { rotationX: 0, autoAlpha: 1, duration: 0.7, ease: "sleek", stagger: 0.015, overwrite: "auto" },
      );
    };

    bag.add(on(a, "pointerenter", flip));
    bag.add(
      on(a, "focus", () => {
        if (a.matches(":focus-visible")) flip();
      }),
    );
    bag.add(() => {
      if (chars.length) gsap.killTweensOf(chars);
      split?.revert();
      split = null;
      chars = [];
      a.style.perspective = "";
    });
  });

  return bag.run;
}

// ── F16 ───────────────────────────────────────────────────────────────────

/**
 * 12 dots fly out from the centre of `host` (a positioned element the size of the button) and fade.
 * Resolves when every dot has been removed. Callers check the desktop gate first.
 */
export function playCopyBurst(host: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const count = 12;
    const step = (Math.PI * 2) / count;
    const jitter = (12 * Math.PI) / 180;

    const dots = Array.from({ length: count }, () => {
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      dot.className = "pointer-events-none absolute left-1/2 top-1/2 -ml-[3px] -mt-[3px] size-1.5 rounded-full bg-white";
      host.appendChild(dot);
      return dot;
    });
    const angles = dots.map((_, i) => i * step + gsap.utils.random(-jitter, jitter));

    gsap.to(dots, {
      x: (i: number) => Math.cos(angles[i]) * gsap.utils.random(40, 90),
      y: (i: number) => Math.sin(angles[i]) * gsap.utils.random(40, 90),
      scale: 0,
      autoAlpha: 0,
      duration: 0.9,
      ease: "sleek",
      stagger: 0.01,
      onComplete: () => {
        dots.forEach((d) => d.remove());
        resolve();
      },
    });
  });
}

export function initContact(): Cleanup {
  const bag = cleanupBag();
  bag.add(initGlow());
  bag.add(initEmailFlip());
  return bag.run;
}
