import { Draggable, gsap, ScrollTrigger } from "@/lib/gsap";
import { cleanupBag, clamp, noop, on, qsa, type Cleanup } from "@/lib/motion";

/**
 * ABOUT (spec: gsap-animation.md)
 *   F5  highlighter marker redraws on hover
 *   F6  sticky heading skews with scroll speed (About and Experience)
 *   F7  fact cards can be dragged and spring back
 */

// ── F5 ────────────────────────────────────────────────────────────────────

function initMarker(): Cleanup {
  const scope = document.querySelector<HTMLElement>("#about");
  if (!scope?.querySelector("mark.marker")) return noop;

  const bag = cleanupBag();
  const touched = new Set<HTMLElement>();

  // Delegated, and looked up fresh each time: the reveal reverts its SplitText when it finishes,
  // which swaps the original nodes back in.
  bag.add(
    on<PointerEvent>(
      scope,
      "pointerover",
      (e) => {
        const mark = e.target instanceof Element ? e.target.closest<HTMLElement>("mark.marker") : null;
        if (!mark || (e.relatedTarget instanceof Node && mark.contains(e.relatedTarget))) return;
        // Wait for the first reveal to finish (flag set in page-motion.tsx), and never overlap a tween.
        if (mark.dataset.ready !== "1" || gsap.isTweening(mark)) return;
        touched.add(mark);
        gsap.fromTo(
          mark,
          { backgroundSize: "0% 100%", backgroundRepeat: "no-repeat" },
          { backgroundSize: "100% 100%", duration: 0.9, ease: "sleek", clearProps: "backgroundSize,backgroundRepeat" },
        );
      },
      { passive: true },
    ),
  );

  bag.add(() => {
    touched.forEach((m) => {
      gsap.killTweensOf(m);
      gsap.set(m, { clearProps: "backgroundSize,backgroundRepeat" });
    });
    touched.clear();
  });
  return bag.run;
}

// ── F6 ────────────────────────────────────────────────────────────────────

function initStickyHeads(): Cleanup {
  const heads = qsa("[data-sticky-head]");
  if (!heads.length) return noop;

  const bag = cleanupBag();

  heads.forEach((head) => {
    const section = head.closest<HTMLElement>("section") ?? head;
    // Skew goes on the wrapper only: SplitText works on the heading inside it.
    const skewTo = gsap.quickTo(head, "skewY", { duration: 0.6, ease: "sleek" });
    const st = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => skewTo(clamp(-2, 2, self.getVelocity() / -600)),
      onToggle: (self) => {
        if (!self.isActive) skewTo(0);
      },
    });
    const settle = () => skewTo(0);
    ScrollTrigger.addEventListener("scrollEnd", settle);

    bag.add(() => {
      st.kill();
      ScrollTrigger.removeEventListener("scrollEnd", settle);
      gsap.killTweensOf(head, "skewY");
      gsap.set(head, { clearProps: "transform" });
    });
  });

  return bag.run;
}

// ── F7 ────────────────────────────────────────────────────────────────────

function initFactCards(): Cleanup {
  const grid = document.querySelector<HTMLElement>("#about dl");
  if (!grid) return noop;

  const bag = cleanupBag();
  const draggables = new Map<HTMLElement, Draggable>();

  bag.add(
    on<PointerEvent>(
      grid,
      "pointerover",
      (e) => {
        const card = e.target instanceof Element ? e.target.closest<HTMLElement>("#about dl > div") : null;
        if (!card || draggables.has(card)) return;
        // Created lazily on the first hover, and never while the card's own reveal is still playing.
        if (gsap.isTweening(card)) return;
        const [instance] = Draggable.create(card, {
          type: "x,y",
          edgeResistance: 0.8,
          zIndexBoost: true,
          minimumMovement: 4,
          onPress() {
            gsap.to(this.target, { scale: 1.04, rotation: 0, duration: 0.4, ease: "sleek", overwrite: "auto" });
          },
          onRelease() {
            gsap.to(this.target, { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.1, ease: "sleekSpring", overwrite: "auto" });
          },
        });
        if (instance) draggables.set(card, instance);
      },
      { passive: true },
    ),
  );

  bag.add(() => {
    draggables.forEach((d, card) => {
      d.kill();
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: "transform,zIndex,touchAction" });
    });
    draggables.clear();
  });
  return bag.run;
}

export function initAbout(): Cleanup {
  const bag = cleanupBag();
  bag.add(initMarker());
  bag.add(initStickyHeads());
  bag.add(initFactCards());
  return bag.run;
}
