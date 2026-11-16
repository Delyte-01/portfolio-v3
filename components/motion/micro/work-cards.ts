import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";
import { cleanupBag, noop, normXY, on, qsa, trackHover, type Cleanup } from "@/lib/motion";

/**
 * SELECTED WORK (spec: gsap-animation.md)
 *   F2  project visual: tilt, shine, hard shadow that follows, screenshot that moves against the tilt
 *       (the "device" depth from 3d-model-animation.md section 6.3)
 *   F3  project title: letter wave
 *   F4  tech chips pop in
 *
 * Both work sections carry `data-section="work"` (#work and #archive), so one delegated listener per
 * section covers every project card.
 */

type QuickTo = ReturnType<typeof gsap.quickTo>;

// ── F2 ────────────────────────────────────────────────────────────────────

interface TiltState {
  frame: HTMLElement;
  /** Un-transformed parent: its rect is stable while the frame tilts (no feedback loop). */
  wrap: HTMLElement;
  shadow: HTMLElement;
  shine: HTMLElement;
  clip: HTMLElement;
  /** The screenshot wrapper (absent on placeholder cards). It moves against the tilt: 3d-model-animation.md 6.3. */
  screen: HTMLElement | null;
  rect: DOMRect;
  active: boolean;
  rx?: QuickTo;
  ry?: QuickTo;
  sx?: QuickTo;
  sy?: QuickTo;
  px?: QuickTo;
  py?: QuickTo;
}

const MAX_SCREEN = 6; // px, the screenshot moves this far against the tilt
const MAX_TILT = 5; // degrees
const MAX_SHADOW = 5; // px, additive to the base 8 px offset

function initTilt(): Cleanup {
  const sections = qsa('[data-section="work"]');
  if (!sections.some((s) => s.querySelector("[data-tilt]"))) return noop;

  const bag = cleanupBag();
  const states = new Map<HTMLElement, TiltState>();

  const find = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>("[data-tilt]") : null);

  /** Looks up (or builds) the state for a frame. Returns null while its clip-path reveal is running. */
  const activate = (frame: HTMLElement, x: number, y: number): TiltState | null => {
    let s = states.get(frame);
    if (!s) {
      const wrap = frame.parentElement;
      const shadow = wrap?.querySelector<HTMLElement>("[data-tilt-shadow]");
      const shine = frame.querySelector<HTMLElement>("[data-shine]");
      const clip = frame.querySelector<HTMLElement>("[data-reveal='clip']");
      if (!wrap || !shadow || !shine || !clip) return null;
      const screen = frame.querySelector<HTMLElement>("[data-screen]");
      s = { frame, wrap, shadow, shine, clip, screen, rect: wrap.getBoundingClientRect(), active: false };
      states.set(frame, s);
    }
    if (s.active) return s;
    // Never tilt a card whose reveal is still playing.
    if (gsap.isTweening(s.clip)) return null;

    s.active = true;
    s.rect = s.wrap.getBoundingClientRect();
    // A return-to-rest tween may still be running from the last visit: take over from where it is.
    gsap.killTweensOf(s.frame, "rotationX,rotationY");
    gsap.killTweensOf(s.shadow, "x,y");
    if (s.screen) gsap.killTweensOf(s.screen, "x,y");
    gsap.set(s.frame, { transformPerspective: 900, transformOrigin: "50% 50%" });
    s.frame.style.willChange = "transform";
    s.rx = gsap.quickTo(s.frame, "rotationX", { duration: 0.7, ease: "sleek" });
    s.ry = gsap.quickTo(s.frame, "rotationY", { duration: 0.7, ease: "sleek" });
    s.sx = gsap.quickTo(s.shadow, "x", { duration: 0.7, ease: "sleek" });
    s.sy = gsap.quickTo(s.shadow, "y", { duration: 0.7, ease: "sleek" });
    if (s.screen) {
      s.px = gsap.quickTo(s.screen, "x", { duration: 0.7, ease: "sleek" });
      s.py = gsap.quickTo(s.screen, "y", { duration: 0.7, ease: "sleek" });
    }
    place(s, x, y);
    gsap.to(s.shine, { autoAlpha: 1, duration: 0.5, ease: "sleek", overwrite: "auto" });
    return s;
  };

  const place = (s: TiltState, x: number, y: number) => {
    s.shine.style.setProperty("--mx", `${x - s.rect.left}px`);
    s.shine.style.setProperty("--my", `${y - s.rect.top}px`);
  };

  const reset = (s: TiltState) => {
    gsap.killTweensOf([s.frame, s.shadow, s.shine]);
    gsap.set([s.frame, s.shadow], { clearProps: "transform" });
    if (s.screen) {
      gsap.killTweensOf(s.screen);
      gsap.set(s.screen, { clearProps: "transform" });
    }
    gsap.set(s.shine, { clearProps: "opacity,visibility" });
    s.shine.style.removeProperty("--mx");
    s.shine.style.removeProperty("--my");
    s.frame.style.willChange = "";
    s.active = false;
  };

  sections.forEach((section) => {
    bag.add(
      trackHover<HTMLElement>(section, {
        find,
        enter: (frame, x, y) => {
          activate(frame, x, y);
        },
        move: (frame, x, y) => {
          const s = states.get(frame)?.active ? states.get(frame) : activate(frame, x, y);
          if (!s) return;
          const { nx, ny } = normXY(x, y, s.rect);
          s.ry?.(nx * MAX_TILT);
          s.rx?.(-ny * MAX_TILT);
          s.sx?.(-nx * MAX_SHADOW);
          s.sy?.(-ny * MAX_SHADOW);
          s.px?.(-nx * MAX_SCREEN);
          s.py?.(-ny * MAX_SCREEN);
          place(s, x, y);
        },
        scroll: (frame) => {
          const s = states.get(frame);
          if (s) s.rect = s.wrap.getBoundingClientRect();
        },
        leave: (frame) => {
          const s = states.get(frame);
          if (!s?.active) return;
          s.active = false;
          gsap.killTweensOf(s.frame, "rotationX,rotationY");
          gsap.killTweensOf(s.shadow, "x,y");
          if (s.screen) {
            gsap.killTweensOf(s.screen, "x,y");
            gsap.to(s.screen, { x: 0, y: 0, duration: 1, ease: "sleekSpring", overwrite: "auto" });
          }
          gsap.to(s.frame, {
            rotationX: 0,
            rotationY: 0,
            duration: 1,
            ease: "sleekSpring",
            overwrite: "auto",
            onComplete: () => {
              if (!s.active) s.frame.style.willChange = "";
            },
          });
          gsap.to(s.shadow, { x: 0, y: 0, duration: 1, ease: "sleekSpring", overwrite: "auto" });
          gsap.to(s.shine, { autoAlpha: 0, duration: 0.4, ease: "sleekOut", overwrite: "auto" });
        },
      }),
    );
  });

  bag.add(() => {
    states.forEach(reset);
    states.clear();
  });
  return bag.run;
}

// ── F3 ────────────────────────────────────────────────────────────────────

function initTitleWave(): Cleanup {
  const sections = qsa('[data-section="work"]');
  const links = sections.flatMap((s) => qsa<HTMLAnchorElement>("[data-project] h3 a[data-split-hover]", s));
  if (!links.length) return noop;

  const bag = cleanupBag();
  const splits = new Map<HTMLElement, { split: SplitText; chars: Element[] }>();
  const waves = new Map<HTMLElement, gsap.core.Animation>();

  const findLink = (t: EventTarget | null) =>
    t instanceof Element ? t.closest<HTMLElement>("[data-project] h3 a[data-split-hover]") : null;

  const wave = (a: HTMLElement) => {
    let entry = splits.get(a);
    if (!entry) {
      // Words keep their line-break behaviour; chars are what moves.
      const split = SplitText.create(a, {
        type: "words,chars",
        wordsClass: "split-word",
        charsClass: "split-char",
      });
      entry = { split, chars: split.chars as Element[] };
      splits.set(a, entry);
    }
    if (waves.get(a)?.isActive()) return;
    waves.set(
      a,
      gsap.fromTo(
        entry.chars,
        { y: 0 },
        { keyframes: { y: [0, -8, 0] }, duration: 0.7, ease: "sleek", stagger: { each: 0.018 }, overwrite: "auto" },
      ),
    );
  };

  sections.forEach((section) => {
    bag.add(
      on<PointerEvent>(
        section,
        "pointerover",
        (e) => {
          const a = findLink(e.target);
          if (!a || (e.relatedTarget instanceof Node && a.contains(e.relatedTarget))) return;
          wave(a);
        },
        { passive: true },
      ),
    );
    // Keyboard equivalent: the same wave when the link receives focus from the keyboard.
    bag.add(
      on<FocusEvent>(section, "focusin", (e) => {
        const a = findLink(e.target);
        if (a && (e.target as HTMLElement).matches(":focus-visible")) wave(a);
      }),
    );
  });

  bag.add(() => {
    waves.forEach((w) => w.kill());
    waves.clear();
    splits.forEach(({ split }) => split.revert());
    splits.clear();
  });
  return bag.run;
}

// ── F4 ────────────────────────────────────────────────────────────────────

function initTechChips(): Cleanup {
  const lists = qsa("[data-tech]");
  if (!lists.length) return noop;

  const bag = cleanupBag();
  const touched: HTMLElement[] = [];

  lists.forEach((ul) => {
    const chips = Array.from(ul.children) as HTMLElement[];
    // Lists already in view are left alone: hiding them now would flash them.
    if (!chips.length || ul.getBoundingClientRect().top <= window.innerHeight * 0.9) return;

    gsap.set(chips, { autoAlpha: 0, y: 10, scale: 0.9 });
    touched.push(...chips);

    const st = ScrollTrigger.create({
      trigger: ul,
      start: "top 90%",
      once: true,
      onEnter: () => {
        gsap.fromTo(
          chips,
          { autoAlpha: 0, y: 10, scale: 0.9 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.6,
            ease: "pop",
            stagger: 0.05,
            delay: 0.2,
            clearProps: "transform,opacity,visibility",
          },
        );
      },
    });
    bag.add(() => st.kill());
  });

  bag.add(() => {
    if (!touched.length) return;
    gsap.killTweensOf(touched);
    gsap.set(touched, { clearProps: "transform,opacity,visibility" });
  });
  return bag.run;
}

export function initWorkCards(): Cleanup {
  const bag = cleanupBag();
  bag.add(initTilt());
  bag.add(initTitleWave());
  bag.add(initTechChips());
  return bag.run;
}
