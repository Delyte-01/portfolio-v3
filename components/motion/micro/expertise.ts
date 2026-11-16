import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cleanupBag, clamp, noop, on, qsa, trackHover, type Cleanup } from "@/lib/motion";

/**
 * EXPERTISE (spec: gsap-animation.md)
 *   F8   magnetic chips with neighbour nudge
 *   F9   badge jiggle
 *   F10  "N tools" counter
 */

type QuickTo = ReturnType<typeof gsap.quickTo>;

const RADIUS = 130; // px: chips further than this from the pointer stay put
const PULL = 0.22; // fraction of the pointer offset a chip follows (max about 10 px)

interface CardState {
  card: HTMLElement;
  chips: HTMLElement[];
  /** Resting centres in viewport space (current transform removed). */
  centres: Array<{ x: number; y: number }>;
  quick: Map<HTMLElement, { x: QuickTo; y: QuickTo }>;
  recache?: gsap.core.Tween;
}

// ── F8 + F9 ───────────────────────────────────────────────────────────────

function initChips(): Cleanup {
  const grid = document.querySelector<HTMLElement>("#expertise");
  const cards = grid ? qsa("[data-skill-card]", grid) : [];
  if (!grid || !cards.length) return noop;

  const bag = cleanupBag();
  const states = new Map<HTMLElement, CardState>();

  const stateFor = (card: HTMLElement): CardState => {
    let s = states.get(card);
    if (!s) {
      s = { card, chips: qsa("[data-chip]", card), centres: [], quick: new Map() };
      states.set(card, s);
    }
    return s;
  };

  /** Measures each chip once (never inside the move handler). Subtracts the chip's own offset. */
  const measure = (s: CardState) => {
    s.centres = s.chips.map((chip) => {
      const r = chip.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - Number(gsap.getProperty(chip, "x")),
        y: r.top + r.height / 2 - Number(gsap.getProperty(chip, "y")),
      };
    });
  };

  const quickFor = (s: CardState, chip: HTMLElement) => {
    let q = s.quick.get(chip);
    if (!q) {
      q = {
        x: gsap.quickTo(chip, "x", { duration: 0.5, ease: "sleek" }),
        y: gsap.quickTo(chip, "y", { duration: 0.5, ease: "sleek" }),
      };
      s.quick.set(chip, q);
    }
    return q;
  };

  const settle = (s: CardState) => {
    s.recache?.kill();
    gsap.killTweensOf(s.chips, "x,y");
    s.quick.clear();
    gsap.to(s.chips, { x: 0, y: 0, duration: 1, ease: "sleekSpring", stagger: 0.015, overwrite: "auto" });
  };

  bag.add(
    trackHover<HTMLElement>(grid, {
      find: (t) => (t instanceof Element ? t.closest<HTMLElement>("[data-skill-card]") : null),
      enter: (card) => {
        const s = stateFor(card);
        // Take over from any return tween that is still running.
        gsap.killTweensOf(s.chips, "x,y");
        measure(s);
        // The card lifts and straightens over 0.5 s on hover: measure again once it has settled.
        s.recache?.kill();
        s.recache = gsap.delayedCall(0.6, () => measure(s));

        // F9: the icon badge jiggles back to rest.
        const badge = card.querySelector<HTMLElement>("[data-skill-badge]");
        if (badge) {
          gsap.fromTo(
            badge,
            { rotation: -14, scale: 0.9 },
            { rotation: 0, scale: 1, duration: 0.9, ease: "sleekSpring", overwrite: "auto" },
          );
        }
      },
      move: (card, px, py) => {
        const s = states.get(card);
        if (!s) return;
        s.chips.forEach((chip, i) => {
          const c = s.centres[i];
          if (!c) return;
          const dx = px - c.x;
          const dy = py - c.y;
          const strength = clamp(0, 1, 1 - Math.hypot(dx, dy) / RADIUS);
          const q = quickFor(s, chip);
          q.x(dx * PULL * strength);
          q.y(dy * PULL * strength);
        });
      },
      scroll: (card) => {
        const s = states.get(card);
        if (s) measure(s);
      },
      leave: (card) => {
        const s = states.get(card);
        if (s) settle(s);
      },
    }),
  );

  // Keyboard equivalent for F9: the badge jiggles when focus moves into a card.
  bag.add(
    on<FocusEvent>(grid, "focusin", (e) => {
      const card = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-skill-card]") : null;
      if (!card || (e.relatedTarget instanceof Node && card.contains(e.relatedTarget))) return;
      const badge = card.querySelector<HTMLElement>("[data-skill-badge]");
      if (badge) {
        gsap.fromTo(
          badge,
          { rotation: -14, scale: 0.9 },
          { rotation: 0, scale: 1, duration: 0.9, ease: "sleekSpring", overwrite: "auto" },
        );
      }
    }),
  );

  bag.add(() => {
    states.forEach((s) => {
      s.recache?.kill();
      s.quick.clear();
      gsap.killTweensOf(s.chips);
      gsap.set(s.chips, { clearProps: "transform" });
    });
    states.clear();
    const badges = qsa("[data-skill-badge]", grid);
    if (!badges.length) return;
    gsap.killTweensOf(badges);
    gsap.set(badges, { clearProps: "transform" });
  });
  return bag.run;
}

// ── F10 ───────────────────────────────────────────────────────────────────

function initCounters(): Cleanup {
  const counters = qsa("[data-count-to]");
  if (!counters.length) return noop;

  const bag = cleanupBag();

  counters.forEach((el) => {
    const target = Number(el.dataset.countTo);
    if (!Number.isFinite(target)) return;
    const card = el.closest<HTMLElement>("[data-skill-card]") ?? el;

    // The server-rendered text is already the final number. Cards that are still below the fold
    // start from 0; cards already in view are left alone (no flash, no replay).
    if (card.getBoundingClientRect().top <= window.innerHeight * 0.85) return;
    el.textContent = "0";

    const counter = { n: 0 };
    const st = ScrollTrigger.create({
      trigger: card,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          n: target,
          duration: 1,
          ease: "sleek",
          onUpdate: () => {
            el.textContent = String(Math.round(counter.n));
          },
          onComplete: () => {
            el.textContent = String(target);
          },
        });
      },
    });

    bag.add(() => {
      st.kill();
      gsap.killTweensOf(counter);
      el.textContent = String(target);
    });
  });

  return bag.run;
}

export function initExpertise(): Cleanup {
  const bag = cleanupBag();
  bag.add(initChips());
  bag.add(initCounters());
  return bag.run;
}
