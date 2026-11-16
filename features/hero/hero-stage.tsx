"use client";

/**
 * Hero stage: "design it, build it, ship it".
 * Spec (single source of truth): hero-animation.md (loop) + hero-v2.md (browser frame, second act).
 *
 *  - The right side of the hero is a decorative Chrome-style browser (aria-hidden, nothing focusable).
 *  - Tab 1 plays the original loop (draw the mark, build the page). After the cursor presses "See my work"
 *    a second tab opens, a real project screenshot scrolls, the tab closes and the usual collapse runs.
 *  - The SSR / no-JS / phone / reduced-motion markup is the FINISHED frame (tab 1, nav + logo + card built,
 *    cursor hidden). JS applies the hidden start state only on desktop with motion allowed.
 *  - The stage only DISPATCHES step signals (hero-events.ts); the left side listens.
 *  - All numbers live in `T` (times) and `POS` (coordinates) below, so the feel can be tuned without
 *    reading the timeline code. Pixel values are design pixels inside a fixed 640 x 520 box which is
 *    scaled with a CSS variable (`--s`) written by one ResizeObserver (no React state).
 *  - Only transform, opacity, clip-path and stroke-dashoffset are animated.
 */

import { useLayoutEffect, useRef } from "react";

import { ICON, LETTERS } from "@/components/brand/logo-parts";
import { projects } from "@/lib/data/projects";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { emitHero } from "./hero-events";

/* ───────────────────────────── Tuning knobs ───────────────────────────── */

type Pt = readonly [number, number];

/** Every time (s) and duration. Phones and reduced-motion visitors get the static finished frame (no loop). */
const T = {
  desktop: {
    repeatDelay: 0.4,
    intro: { dur: 1.1, loopDelay: 0.3 },
    // Scene A: draw the mark
    cursorIn: 0.3,
    approach: { at: 0.2, dur: 1.1 },
    click1: 1.3,
    stem: { at: 1.4, dur: 0.6 },
    stemOut: { at: 2.0, dur: 0.25 },
    mirror: { at: 2.0, dur: 0.35, chipText2At: 2.35, chipOutAt: 3.3 },
    pairs: [2.35, 2.7, 3.05], // (d,c) (f,e) (h,g)
    pairDur: 0.6,
    orbit: { at: 2.0, dur: 1.4 },
    // Scene B: logo becomes the header
    grab: 3.4,
    fly: { at: 3.5, dur: 0.9 },
    letters: { at: 4.2, fade: 0.45, rise: 0.7, stagger: 0.07 },
    nav: { at: 4.4, hair: 0.8, links: 0.6, linkStagger: 0.06, cta: 0.6 },
    // Scene C: build the page
    toCard: { at: 5.05, dur: 0.5 },
    click2: 5.55,
    handlesIn: 5.6,
    drag: { at: 5.6, dur: 0.9 },
    handlesOut: 6.5,
    cardShadow: { at: 6.3, dur: 0.4 },
    spacing: { at: 6.5, dur: 0.4, outAt: 7.3, outDur: 0.3 },
    heading: { at: 6.55, dur: 0.9, stagger: 0.1 },
    bars: { at: 6.9, dur: 0.7, stagger: 0.08 },
    image: { at: 7.0, dur: 0.8 },
    avatar: { at: 7.0, dur: 0.7 },
    button: { at: 7.2, dur: 0.7 },
    // Scene D: interact
    toButton: { at: 7.2, dur: 0.7 },
    hover: { at: 7.9, dur: 0.4 },
    chip: { at: 8.0, dur: 0.5 },
    press: 8.15,
    // Scene E: collapse and reset (offsets from `base`, scaled by `k`)
    // Scene F (act 2): ship it. A new tab opens on a real project, the page scrolls, the tab closes.
    F: {
      chipOut: 8.6,
      tab: { at: 8.6, dur: 0.5 },
      move: { at: 8.7, dur: 0.9 },
      addr: { clearAt: 8.75, at: 8.9, dur: 0.8 },
      load: { at: 9.0, dur: 0.6, finishAt: 9.6, finishDur: 0.3, outAt: 9.95 },
      view: { at: 9.5, dur: 0.55 },
      title: 9.7,
      scroll: { at: 10.0, dur: 5.4 },
      drift: { at: 10.0, dur: 4.6 },
      toClose: { at: 14.9, dur: 0.7 },
      click: 15.65,
      close: { at: 15.75, dur: 0.45 },
    },
    // Scene E: collapse and reset (offsets from `base`, scaled by `k`)
    E: { base: 16.5, k: 1 },
  },
  /** Shared by every click. */
  press: 0.12,
  ripple: 0.7,
} as const;

/** Viewport of the new tab, in design px (window coordinates). */
const VIEW = { w: 608, h: 419 } as const;

/** Every coordinate used by the timeline (design px in the 640 x 520 box). */
const POS = {
  cursorStart: [596, 476] as Pt,
  approach: [[596, 476], [470, 400], [343, 312]] as Pt[],
  stemTop: [343, 312] as Pt,
  stemBottom: [343, 383] as Pt,
  orbit: [[343, 383], [401, 359], [261, 381], [239, 241], [379, 219], [320, 300]] as Pt[],
  center: [320, 300] as Pt,
  navIcon: [58, 100] as Pt,
  cardCorner: [88, 150] as Pt,
  cardSize: [464, 290] as Pt,
  toButton: [[552, 440], [480, 430], [180, 392]] as Pt[],
  button: [180, 392] as Pt,
  /** Act 2 (page coordinates, same space as the rest: the overlay layer sits below the browser chrome). */
  viewIn: [330, 330] as Pt,
  drift: [[330, 330], [440, 250], [370, 160], [250, 230]] as Pt[],
  tabClose: [305, 10] as Pt,
  /** Icon layer: stage A (centre) -> nav slot. */
  fly: { x: -181, y: -133, scale: 0.158 },
  /** `letters` start offset: 28 stage px expressed in logo units (slot is 65 px for 462.3 units). */
  letterY: 28 / (65 / 462.3),
  /** Ring centre of the mark (logo units), the origin the petals grow from. */
  ringCenter: "223.6 384.5",
  curviness: 1.25,
} as const;

const CARD_CLIP_HIDDEN = "inset(0% 100% 100% 0% round 14px)";
const CARD_CLIP_SHOWN = "inset(0% 0% 0% 0% round 14px)";
const PAIRS: readonly [number, number][] = [
  [0, 7], // b + i
  [2, 1], // d + c
  [4, 3], // f + e
  [6, 5], // h + g
];

const host = (() => {
  try {
    return new URL(site.url).host;
  } catch {
    return site.url;
  }
})();

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/** Real project screenshots for act 2 (desktop only; the images are created in JS, never in the markup). */
const SHOTS = projects
  .filter((p) => p.image)
  .map((p) => ({ title: p.title, src: p.image as string, host: hostOf(p.live ?? site.url) }));

/* ───────────────────────────── Component ───────────────────────────── */

export function HeroStage({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // One ResizeObserver, writes --s straight to the DOM (no React state). Runs for every visitor,
  // including reduced-motion, so the finished frame is always sized correctly.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const apply = () => inner.style.setProperty("--s", String(wrap.clientWidth / 640));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const mm = gsap.matchMedia();
      try {
        mm.add(
          "(prefers-reduced-motion: no-preference) and (min-width: 768px)",
          () => {
            const cleanups: Array<() => void> = [];

            /* ── Element lookup ─────────────────────────────────────── */
            const q = gsap.utils.selector(wrap);
            const all = (s: string) => q(`[data-s="${s}"]`) as HTMLElement[];
            const one = (s: string) => all(s)[0];
            const el = {
              win: one("window"),
              grid: one("grid"),
              cursor: one("cursor"),
              ripple: one("ripple"),
              icon: one("icon"),
              iconRot: one("iconrot"),
              stem: q('[data-s="stem"]')[0] as unknown as SVGPathElement,
              petals: q('[data-s="petal"]') as unknown as SVGPathElement[],
              letters: q('[data-s="letter"]') as unknown as SVGPathElement[],
              hair: one("hair"),
              links: all("link"),
              cta: one("cta"),
              card: one("card"),
              cardShadow: one("cardshadow"),
              hMasks: all("hmask"),
              hText: all("htext"),
              bars: all("bar"),
              image: one("image"),
              avatar: one("avatar"),
              button: one("button"),
              btnShadow: one("btnshadow"),
              chip: one("chip"),
              spacing: one("spacing"),
              handles: all("handle"),
              mirror: one("mirror"),
              mirrorText: one("mirrortext"),
              tab1: one("tab1"),
              tab1shape: one("tab1shape"),
              tab1c: one("tab1c"),
              tab2: one("tab2"),
              tab2title: one("tab2title"),
              plus: one("plus"),
              addr: one("addr"),
              load: one("load"),
              view: one("view"),
              cap: one("cap"),
            };

            const ease = { silk: "silk", glide: "glide", settle: "settle" } as const;
            const petalPair = (pair: readonly [number, number]) => [el.petals[pair[0]], el.petals[pair[1]]];

            /* ── Hidden start state (= end state of every loop) ──────── */
            const initialState = () => {
              gsap.set(el.win, { autoAlpha: 0, y: 24, scale: 0.97 });
              gsap.set(el.cursor, { autoAlpha: 0, x: POS.cursorStart[0], y: POS.cursorStart[1], scale: 1 });
              gsap.set(el.stem, { drawSVG: "0%", autoAlpha: 0 }); // hidden too: round caps can paint a dot at 0%
              gsap.set(el.petals, { scale: 0, autoAlpha: 0, svgOrigin: POS.ringCenter });
              gsap.set(el.icon, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" });
              gsap.set(el.iconRot, { rotation: 0, transformOrigin: "50% 50%" });
              gsap.set(el.hair, { scaleX: 0, autoAlpha: 0, transformOrigin: "0% 50%" });
              gsap.set(el.links, { scaleX: 0, autoAlpha: 0, transformOrigin: "0% 50%" });
              gsap.set(el.cta, { autoAlpha: 0, scale: 0.9 });
              gsap.set(el.letters, { y: POS.letterY, autoAlpha: 0 });
              gsap.set(el.card, { clipPath: CARD_CLIP_HIDDEN, autoAlpha: 1, y: 0 });
              gsap.set(el.cardShadow, { autoAlpha: 0 });
              gsap.set(el.hMasks, { autoAlpha: 0 });
              gsap.set(el.hText, { yPercent: 105 });
              gsap.set(el.bars, { autoAlpha: 0, scaleX: 0, transformOrigin: "0% 50%" });
              gsap.set(el.image, { autoAlpha: 0, clipPath: "inset(100% 0% 0% 0%)" });
              gsap.set(el.avatar, { autoAlpha: 0, x: -12 });
              gsap.set(el.button, { autoAlpha: 0, scale: 0.9, y: 0 });
              gsap.set(el.btnShadow, { autoAlpha: 0, y: 0 });
              gsap.set([el.chip, el.spacing, el.mirror, el.ripple, ...el.handles], { autoAlpha: 0 });
              gsap.set(el.grid, { x: 0, y: 0 });
              // Browser chrome: tab 1 active, no second tab, no loading bar, no second page.
              gsap.set(el.tab1shape, { autoAlpha: 1 });
              gsap.set(el.tab1c, { autoAlpha: 1 });
              gsap.set(el.tab2, { autoAlpha: 0, x: 0 });
              gsap.set(el.plus, { x: 0 });
              gsap.set(el.load, { autoAlpha: 0, scaleX: 0, transformOrigin: "0% 50%" });
              gsap.set(el.view, { autoAlpha: 0, y: 0 });
              el.addr.textContent = host;
              el.tab2title.textContent = "New tab";
              el.tab2.removeAttribute("data-ready");
            };
            initialState();

            /* ── Timeline helpers ────────────────────────────────────── */
            // Every cursor travel is a curved MotionPath. A two-point path would be a straight line,
            // so a control point is pushed sideways (perpendicular) to give it an arc.
            let bendSign = 1;
            const curve = (pts: readonly Pt[]): { x: number; y: number }[] => {
              let list = pts;
              if (pts.length === 2) {
                const [a, b] = pts;
                const dx = b[0] - a[0];
                const dy = b[1] - a[1];
                const bend = 0.16 * bendSign;
                bendSign *= -1;
                list = [a, [(a[0] + b[0]) / 2 - dy * bend, (a[1] + b[1]) / 2 + dx * bend], b];
              }
              return list.map(([x, y]) => ({ x, y }));
            };
            const move = (tl: gsap.core.Timeline, pts: readonly Pt[], at: number, dur: number) =>
              tl.to(
                el.cursor,
                { motionPath: { path: curve(pts), curviness: POS.curviness }, duration: dur, ease: ease.glide },
                at,
              );
            const press = (tl: gsap.core.Timeline, at: number) => {
              tl.to(el.cursor, { scale: 0.9, duration: T.press, ease: ease.silk }, at).to(
                el.cursor,
                { scale: 1, duration: T.press, ease: ease.silk },
                at + T.press,
              );
            };
            const ripple = (tl: gsap.core.Timeline, at: number, [x, y]: Pt) => {
              tl.set(el.ripple, { x: x - 14, y: y - 14, scale: 0.4, autoAlpha: 0.5 }, at).to(
                el.ripple,
                { scale: 1.6, autoAlpha: 0, duration: T.ripple, ease: ease.silk },
                at,
              );
            };
            const click = (tl: gsap.core.Timeline, at: number, pt: Pt) => {
              press(tl, at);
              ripple(tl, at, pt);
            };
            const setMirrorText = (text: string) => () => {
              el.mirrorText.textContent = text;
            };
            const pairIn = (tl: gsap.core.Timeline, pair: readonly [number, number], at: number, dur: number) =>
              tl.fromTo(
                petalPair(pair),
                { scale: 0.85, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: dur, ease: ease.settle },
                at,
              );
            const navFurnitureIn = (tl: gsap.core.Timeline, at: number, dur: number) => {
              tl.fromTo(el.hair, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: dur, ease: ease.glide }, at)
                .fromTo(
                  el.links,
                  { scaleX: 0, autoAlpha: 1 },
                  { scaleX: 1, duration: dur, ease: ease.silk, stagger: 0.06 },
                  at,
                )
                .fromTo(
                  el.cta,
                  { autoAlpha: 0, scale: 0.9 },
                  { autoAlpha: 1, scale: 1, duration: dur, ease: ease.settle },
                  at,
                );
            };
            const lettersIn = (tl: gsap.core.Timeline, at: number, rise: number, fade: number, stagger: number) => {
              tl.to(el.letters, { y: 0, duration: rise, ease: ease.silk, stagger }, at).to(
                el.letters,
                { autoAlpha: 1, duration: fade, ease: ease.silk, stagger },
                at,
              );
            };
            const hover = (tl: gsap.core.Timeline, at: number, dur: number) => {
              tl.to(el.button, { y: -3, duration: dur, ease: ease.silk }, at).to(
                el.btnShadow,
                { autoAlpha: 1, y: -3, duration: dur, ease: ease.silk },
                at,
              );
            };
            const buttonPress = (tl: gsap.core.Timeline, at: number) => {
              click(tl, at, POS.button);
              tl.to(el.button, { scale: 0.97, duration: T.press, ease: ease.silk }, at).to(
                el.button,
                { scale: 1, duration: 0.4, ease: ease.settle },
                at + T.press,
              );
            };

            /** Scene E: page collapses, logo returns to the centre, petals unwind. */
            const sceneE = (tl: gsap.core.Timeline, base: number, k: number, from: Pt) => {
              const at = (o: number) => base + o * k;
              const d = (v: number) => v * k;
              move(tl, [from, POS.navIcon], at(0), d(0.6));
              // page fades (chip, button, image, avatar, paragraph, heading, card)
              [el.chip, el.button, el.image, el.avatar, el.bars, el.hMasks, el.card].forEach((target, i) => {
                tl.to(target, { autoAlpha: 0, y: -6, duration: d(0.5), ease: ease.glide }, at(0.3) + i * d(0.04));
              });
              tl.to(el.card, { clipPath: CARD_CLIP_HIDDEN, duration: d(0.5), ease: ease.glide }, at(0.3) + 6 * d(0.04));
              tl.to(el.cardShadow, { autoAlpha: 0, duration: d(0.5), ease: ease.glide }, at(0.3) + 6 * d(0.04));
              tl.to(el.btnShadow, { autoAlpha: 0, duration: d(0.4), ease: ease.glide }, at(0.3));
              // nav fades
              tl.to([el.links, el.cta, el.hair], { autoAlpha: 0, duration: d(0.4), ease: ease.glide }, at(0.5));
              tl.to(
                el.letters,
                { y: POS.letterY, autoAlpha: 0, duration: d(0.5), ease: ease.glide, stagger: { each: d(0.04), from: "end" } },
                at(0.5),
              );
              // icon returns to the centre
              tl.to(el.icon, { x: 0, y: 0, scale: 1, duration: d(0.7), ease: ease.glide }, at(0.7));
              move(tl, [POS.navIcon, POS.center], at(0.7), d(0.7));
              // petals unwind (the icon is 4-fold symmetric, so a 90 degree turn lands on the same shape)
              tl.to(el.iconRot, { rotation: 90, duration: d(0.6), ease: ease.glide }, at(1.4));
              tl.to(
                el.petals,
                { scale: 0, autoAlpha: 0, duration: d(0.5), ease: ease.settle, stagger: d(0.05) },
                at(1.4),
              );
              move(tl, [POS.center, POS.cursorStart], at(1.4), d(0.6));
              tl.to(el.cursor, { autoAlpha: 0, duration: d(0.2), ease: ease.silk }, at(1.8));
              // Reset: invisible at this point, so it is safe. Placed after the last tween.
              tl.set(el.iconRot, { rotation: 0 }, ">");
              tl.set(el.stem, { drawSVG: "0%", autoAlpha: 0 }, "<");
            };

            /* ── Desktop loop (§6) ───────────────────────────────────── */
            const buildDesktop = () => {
              const t = T.desktop;
              const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: t.repeatDelay });

              // Scene A: draw the mark
              tl.to(el.cursor, { autoAlpha: 1, duration: t.cursorIn, ease: ease.silk }, 0);
              move(tl, POS.approach, t.approach.at, t.approach.dur);
              click(tl, t.click1, POS.stemTop);
              tl.set(el.stem, { autoAlpha: 1 }, t.stem.at);
              tl.fromTo(el.stem, { drawSVG: "0%" }, { drawSVG: "100%", duration: t.stem.dur, ease: ease.glide }, t.stem.at);
              // The stem is a straight line, so the cursor rides it in lock-step (same duration + ease).
              tl.to(el.cursor, { y: POS.stemBottom[1], duration: t.stem.dur, ease: ease.glide }, t.stem.at);
              tl.to(el.stem, { autoAlpha: 0, duration: t.stemOut.dur, ease: ease.silk }, t.stemOut.at);
              pairIn(tl, PAIRS[0], t.mirror.at, t.mirror.dur);
              tl.call(setMirrorText("mirror"), undefined, t.mirror.at - 0.01);
              tl.fromTo(el.mirror, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: ease.silk }, t.mirror.at);
              tl.call(setMirrorText("×4 · 90°"), undefined, t.mirror.chipText2At);
              PAIRS.slice(1).forEach((pair, i) => pairIn(tl, pair, t.pairs[i], t.pairDur));
              move(tl, POS.orbit, t.orbit.at, t.orbit.dur);
              tl.to(el.mirror, { autoAlpha: 0, duration: 0.3, ease: ease.silk }, t.mirror.chipOutAt);

              // Scene B: the logo becomes the header
              press(tl, t.grab);
              tl.to(el.icon, { ...POS.fly, duration: t.fly.dur, ease: ease.glide }, t.fly.at);
              move(tl, [POS.center, POS.navIcon], t.fly.at, t.fly.dur);
              lettersIn(tl, t.letters.at, t.letters.rise, t.letters.fade, t.letters.stagger);
              navFurnitureIn(tl, t.nav.at, t.nav.links);

              // Scene C: build the page
              move(tl, [POS.navIcon, POS.cardCorner], t.toCard.at, t.toCard.dur);
              click(tl, t.click2, POS.cardCorner);
              tl.fromTo(el.handles, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: ease.silk }, t.handlesIn);
              // ONE tween on a progress object drives the card clip, the cursor and the 4 handles.
              const [cx, cy] = POS.cardCorner;
              const [cw, ch] = POS.cardSize;
              const dragEnd = t.drag.at + t.drag.dur;
              const prog = { p: 0 };
              tl.fromTo(
                prog,
                { p: 0 },
                {
                  p: 1,
                  duration: t.drag.dur,
                  ease: ease.glide,
                  onUpdate: () => {
                    const p = prog.p;
                    el.card.style.clipPath = `inset(0% ${(1 - p) * 100}% ${(1 - p) * 100}% 0% round 14px)`;
                    const now = tl.time();
                    if (now < t.drag.at - 0.001 || now > dragEnd + 0.001) return; // only drive these while the drag is playing
                    const x = cx + cw * p;
                    const y = cy + ch * p;
                    gsap.set(el.cursor, { x, y });
                    gsap.set(el.handles[0], { x: cx - 3, y: cy - 3 });
                    gsap.set(el.handles[1], { x: x - 3, y: cy - 3 });
                    gsap.set(el.handles[2], { x: cx - 3, y: y - 3 });
                    gsap.set(el.handles[3], { x: x - 3, y: y - 3 });
                  },
                },
                t.drag.at,
              );
              tl.to(el.handles, { autoAlpha: 0, duration: 0.3, ease: ease.silk }, t.handlesOut);
              tl.fromTo(el.cardShadow, { autoAlpha: 0 }, { autoAlpha: 1, duration: t.cardShadow.dur, ease: ease.silk }, t.cardShadow.at);
              tl.fromTo(el.spacing, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: t.spacing.dur, ease: ease.silk }, t.spacing.at);
              tl.to(el.spacing, { autoAlpha: 0, duration: t.spacing.outDur, ease: ease.silk }, t.spacing.outAt);
              tl.set(el.hMasks, { autoAlpha: 1 }, t.heading.at);
              tl.fromTo(
                el.hText,
                { yPercent: 105 },
                { yPercent: 0, duration: t.heading.dur, ease: ease.silk, stagger: t.heading.stagger },
                t.heading.at,
              );
              tl.fromTo(
                el.bars,
                { autoAlpha: 1, scaleX: 0 },
                { scaleX: 1, duration: t.bars.dur, ease: ease.silk, stagger: t.bars.stagger },
                t.bars.at,
              );
              tl.fromTo(
                el.image,
                { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0%)" },
                { clipPath: "inset(0% 0% 0% 0%)", duration: t.image.dur, ease: ease.glide },
                t.image.at,
              );
              tl.fromTo(
                el.avatar,
                { x: -12, autoAlpha: 0 },
                { x: 0, autoAlpha: 1, duration: t.avatar.dur, ease: ease.silk },
                t.avatar.at,
              );
              tl.fromTo(
                el.button,
                { scale: 0.9, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: t.button.dur, ease: ease.settle },
                t.button.at,
              );

              // Scene D: interact
              move(tl, POS.toButton, t.toButton.at, t.toButton.dur);
              hover(tl, t.hover.at, t.hover.dur);
              tl.fromTo(el.chip, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: t.chip.dur, ease: ease.silk }, t.chip.at);
              buttonPress(tl, t.press);

              // Scene F (act 2): ship it
              sceneF(tl);

              // Scene E: collapse and reset
              sceneE(tl, t.E.base, t.E.k, POS.tabClose);

              // Step signals for the left side (caption, scribble). Positions are loop times.
              const total = () => tl.duration() + t.repeatDelay;
              tl.call(() => emitHero({ type: "step", step: 0, duration: t.toCard.at - 0.02 }), undefined, 0.02);
              tl.call(() => emitHero({ type: "step", step: 1, duration: t.F.tab.at - t.toCard.at }), undefined, t.toCard.at);
              tl.call(() => emitHero({ type: "step", step: 2, duration: total() - t.F.tab.at }), undefined, t.F.tab.at);
              return tl;
            };

            /* ── Act 2: a new tab ships a real project ───────────────── */
            const shots = SHOTS;
            let cur = 0;
            let dist = 0;
            let baseX = 0;
            const img = document.createElement("img");
            img.alt = "";
            img.decoding = "async";
            img.draggable = false;
            img.className = "hs__img";
            el.view.appendChild(img);
            const place = () => {
              const nw = img.naturalWidth;
              const nh = img.naturalHeight;
              if (!nw || !nh) return;
              let w: number = VIEW.w;
              let h = (nh * VIEW.w) / nw;
              let x = 0;
              if (h < VIEW.h * 1.3) {
                // Short screenshot: zoom in so there is something to scroll through.
                h = VIEW.h * 1.5;
                w = (nw * h) / nh;
                x = -(w - VIEW.w) / 2;
              }
              baseX = x;
              dist = Math.max(0, h - VIEW.h);
              img.style.width = `${w}px`;
              img.style.height = `${h}px`;
              img.style.transform = `translate3d(${x}px,0,0)`;
              img.style.visibility = "visible";
            };
            img.onload = place;
            img.onerror = () => {
              dist = 0;
              img.style.visibility = "hidden"; // the caption behind it stays as a quiet fallback
            };
            const load = (i: number) => {
              if (!shots.length) return;
              cur = i % shots.length;
              dist = 0;
              baseX = 0;
              img.style.visibility = "hidden";
              el.cap.textContent = shots[cur].title;
              img.src = shots[cur].src;
            };
            cleanups.push(() => img.remove());

            const sceneF = (tl: gsap.core.Timeline) => {
              const f = T.desktop.F;
              const shot = shots[cur] ?? { title: "", host, src: "" };

              // The "See my work" chip steps aside; cursor heads to the new page.
              tl.to(el.chip, { autoAlpha: 0, duration: 0.25, ease: ease.silk }, f.chipOut);
              move(tl, [POS.button, POS.viewIn], f.move.at, f.move.dur);

              // A new tab opens (tab 1 steps back, "+" slides right).
              tl.fromTo(el.tab2, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: f.tab.dur, ease: ease.silk }, f.tab.at);
              tl.to(el.plus, { x: 148, duration: f.tab.dur, ease: ease.glide }, f.tab.at);
              tl.to(el.tab1shape, { autoAlpha: 0, duration: 0.3, ease: ease.silk }, f.tab.at);
              tl.to(el.tab1c, { autoAlpha: 0.6, duration: 0.3, ease: ease.silk }, f.tab.at);
              tl.call(() => {
                el.tab2title.textContent = "New tab";
                el.tab2.removeAttribute("data-ready");
              }, undefined, f.tab.at);

              // The address bar clears, then types the project URL (text only, no layout change).
              tl.call(() => {
                el.addr.textContent = "";
              }, undefined, f.addr.clearAt);
              const typed = { n: 0 };
              tl.fromTo(
                typed,
                { n: 0 },
                {
                  n: 1,
                  duration: f.addr.dur,
                  ease: "none",
                  onUpdate: () => {
                    const url = (shots[cur] ?? shot).host;
                    el.addr.textContent = url.slice(0, Math.round(typed.n * url.length));
                  },
                },
                f.addr.at,
              );

              // Loading bar: quick to ~70 %, then finishes and fades.
              tl.fromTo(el.load, { scaleX: 0, autoAlpha: 1 }, { scaleX: 0.7, duration: f.load.dur, ease: ease.silk, immediateRender: false }, f.load.at);
              tl.to(el.load, { scaleX: 1, duration: f.load.finishDur, ease: ease.glide }, f.load.finishAt);
              tl.to(el.load, { autoAlpha: 0, duration: 0.25, ease: ease.silk }, f.load.outAt);
              tl.call(() => {
                el.tab2title.textContent = (shots[cur] ?? shot).title;
                el.tab2.setAttribute("data-ready", "");
              }, undefined, f.title);

              // The page appears and scrolls smoothly (one proxy tween writes one transform).
              tl.fromTo(el.view, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: f.view.dur, ease: ease.silk }, f.view.at);
              const scroll = { p: 0 };
              tl.fromTo(
                scroll,
                { p: 0 },
                {
                  p: 1,
                  duration: f.scroll.dur,
                  ease: "sine.inOut",
                  onUpdate: () => {
                    img.style.transform = `translate3d(${baseX}px,${(-scroll.p * dist).toFixed(1)}px,0)`;
                  },
                },
                f.scroll.at,
              );

              // The cursor hovers the page, then goes to close the tab.
              move(tl, POS.drift, f.drift.at, f.drift.dur);
              move(tl, [POS.drift[POS.drift.length - 1], POS.tabClose], f.toClose.at, f.toClose.dur);
              click(tl, f.click, POS.tabClose);

              // Tab closes: back to tab 1, address bar back to the portfolio.
              tl.to(el.tab2, { autoAlpha: 0, x: -12, duration: f.close.dur, ease: ease.glide }, f.close.at);
              tl.to(el.plus, { x: 0, duration: f.close.dur, ease: ease.glide }, f.close.at);
              tl.to(el.tab1shape, { autoAlpha: 1, duration: f.close.dur, ease: ease.silk }, f.close.at);
              tl.to(el.tab1c, { autoAlpha: 1, duration: f.close.dur, ease: ease.silk }, f.close.at);
              tl.to(el.view, { autoAlpha: 0, duration: f.close.dur, ease: ease.glide }, f.close.at);
              tl.call(() => {
                el.addr.textContent = host;
              }, undefined, f.close.at);
            };

            const loop = buildDesktop();
            loop.eventCallback("onRepeat", () => load(cur + 1));

            /* ── Start / pause rules  ────────────────────────────── */
            let started = false;
            let inView = true;
            let lastPaused: boolean | null = null;
            const sync = () => {
              if (!started) return;
              const paused = !inView || document.hidden;
              loop.paused(paused);
              if (paused !== lastPaused) {
                lastPaused = paused;
                emitHero({ type: "pause", paused }); // lets the caption ring pause with the loop
              }
            };

            const intro = gsap.to(el.win, {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: T.desktop.intro.dur,
              ease: ease.silk,
              paused: true,
              onComplete: () => {
                gsap.delayedCall(T.desktop.intro.loopDelay, () => {
                  started = true;
                  loop.play();
                  sync();
                });
              },
            });

            // The grid layer drifts forever, one tile at a time, so it loops seamlessly.
            const drift = gsap.to(el.grid, { x: -16, y: -16, duration: 8, ease: "none", repeat: -1, paused: true });

            let begun = false;
            const begin = () => {
              if (begun) return;
              begun = true;
              load(0); // start fetching the first screenshot while the window fades in
              intro.play();
              drift.play();
            };
            if (document.documentElement.dataset.loader === "play") {
              window.addEventListener("delyte:reveal", begin, { once: true });
              const failsafe = window.setTimeout(begin, 6000);
              cleanups.push(() => {
                window.removeEventListener("delyte:reveal", begin);
                window.clearTimeout(failsafe);
              });
            } else {
              begin();
            }

            const st = ScrollTrigger.create({
              trigger: wrap,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self: ScrollTrigger) => {
                inView = self.isActive;
                drift.paused(!inView || document.hidden);
                sync();
              },
              onRefresh: (self: ScrollTrigger) => {
                inView = self.isActive;
                sync();
              },
            });
            const onVisibility = () => {
              drift.paused(!inView || document.hidden);
              sync();
            };
            document.addEventListener("visibilitychange", onVisibility);

            cleanups.push(() => {
              document.removeEventListener("visibilitychange", onVisibility);
              st.kill();
              loop.kill();
              intro.kill();
              drift.kill();
            });
            return () => cleanups.forEach((fn) => fn());
          },
        );
      } catch (err) {
        // If GSAP or a plugin throws, drop every inline style and leave the finished SSR frame visible.
        mm.revert();
        if (process.env.NODE_ENV !== "production") console.error("[hero-stage]", err);
      }

      // Revert every tween, ScrollTrigger and listener on unmount (also covers strict-mode double runs).
      return () => mm.revert();
    },
    { scope: wrapRef },
  );

  return (
    <div ref={wrapRef} className={cn("hs", className)} aria-hidden="true" role="presentation" data-hero-stage>
      <div ref={innerRef} className="hs__inner">
        <div data-s="window" className="hs__win">
          {/* Browser frame */}
          <div className="hs__frame" />
          <div className="hs__strip" />

          {/* Tab 2 (opens in act 2) sits under tab 1 in the DOM; its curved shape overlaps tab 1's */}
          <div data-s="tab2" className="hs__tab hs__tab2">
            <TabShape dataS="tab2shape" />
            <i className="hs__fav hs__fav--ring" />
            <span data-s="tab2title" className="hs__tabtitle">
              New tab
            </span>
            <CloseX />
          </div>

          {/* Tab 1 (the portfolio) */}
          <div data-s="tab1" className="hs__tab hs__tab1">
            <TabShape dataS="tab1shape" />
            <div data-s="tab1c" className="hs__tabc">
              <i className="hs__fav" />
              <span className="hs__tabtitle">Delyte · Portfolio</span>
              <CloseX />
            </div>
          </div>

          <div data-s="plus" className="hs__plus">
            <svg viewBox="0 0 20 20" width="20" height="20" focusable="false">
              <path d="M6.5 10h7M10 6.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Toolbar: back, forward, reload, address bar, profile */}
          <div className="hs__nb" style={{ left: 30 }}>
            <svg viewBox="0 0 16 16" focusable="false">
              <path d="M13 8H3M7.5 3.5 3 8l4.5 4.5" />
            </svg>
          </div>
          <div className="hs__nb hs__nb--dim" style={{ left: 58 }}>
            <svg viewBox="0 0 16 16" focusable="false">
              <path d="M3 8h10M8.5 3.5 13 8l-4.5 4.5" />
            </svg>
          </div>
          <div className="hs__nb" style={{ left: 86 }}>
            <svg viewBox="0 0 16 16" focusable="false">
              <path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" />
            </svg>
          </div>
          <div className="hs__addr">
            <svg className="hs__lock" viewBox="0 0 12 12" focusable="false">
              <rect x="2.5" y="5.4" width="7" height="5" rx="1.2" fill="rgb(10 10 10 / 0.55)" />
              <path d="M4 5.4V4a2 2 0 0 1 4 0v1.4" fill="none" stroke="rgb(10 10 10 / 0.55)" strokeWidth="1.2" />
            </svg>
            <span data-s="addr" className="hs__addrtext">
              {host}
            </span>
          </div>
          <div className="hs__me" />
          <div className="hs__rule" style={{ top: 84 }} />
          <div data-s="load" className="hs__load" />

          {/* Page layer: everything below the chrome, in the original coordinates (offset by one constant) */}
          <div className="hs__page">
            {/* Dotted grid (lives on a 672 x 520 layer so it can drift one tile) */}
            <div className="hs__gridclip">
              <div data-s="grid" className="hs__grid" />
            </div>

            {/* Nav: logo icon (stage A = centre, finished frame = nav slot), wordmark, links, CTA */}
            <div data-s="icon" className="hs__icon">
              <div data-s="iconrot" className="hs__iconrot">
                <svg viewBox="114.8 275.7 217.6 217.6" width="190" height="190" focusable="false">
                  <g fill="#FF6A3D">
                    {ICON.map((p, i) => (
                      <g key={i} data-s="petal" data-i={i}>
                        <path d={p.d} transform={p.m} />
                      </g>
                    ))}
                  </g>
                  <path
                    data-s="stem"
                    d="M250.1 398 L250.1 480"
                    fill="none"
                    stroke="#FF6A3D"
                    strokeWidth="22"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="hs__word">
              <svg viewBox="368.7 305.8 462.3 157.4" width="65" height="22" focusable="false">
                <g fill="#D72B0C">
                  {LETTERS.map((p, i) => (
                    <g key={i} data-s="letter" data-i={i}>
                      <path d={p.d} transform={p.m} />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
            <div data-s="hair" className="hs__rule hs__hair" />
            {[360, 412, 464].map((x) => (
              <i key={x} data-s="link" className="hs__link" style={{ left: x }} />
            ))}
            <div data-s="cta" className="hs__cta" />

            {/* Page: card + its content (card-relative coordinates) */}
            <div data-s="cardshadow" className="hs__card hs__cardshadow" />
            <div data-s="card" className="hs__card hs__cardface">
              <div data-s="hmask" className="hs__mask" style={{ top: 28 }}>
                <span data-s="htext" className="hs__h">
                  Crafted with care,
                </span>
              </div>
              <div data-s="hmask" className="hs__mask" style={{ top: 59 }}>
                <span data-s="htext" className="hs__h">
                  built to move.
                </span>
              </div>
              <i data-s="bar" className="hs__bar" style={{ left: 28, top: 112, width: 300 }} />
              <i data-s="bar" className="hs__bar" style={{ left: 28, top: 130, width: 220 }} />
              <div data-s="image" className="hs__image" />
              <div data-s="avatar" className="hs__avatar">
                <i className="hs__avatar-dot" />
                <i className="hs__avatar-bar" style={{ top: 4, width: 100 }} />
                <i className="hs__avatar-bar" style={{ top: 16, width: 64 }} />
              </div>
              <div data-s="btnshadow" className="hs__btn hs__btnshadow" />
              <div data-s="button" className="hs__btn hs__btnface">
                See my work
              </div>
              <div data-s="chip" className="hs__chip">
                ease: &quot;silk&quot;
              </div>
            </div>

            {/* Annotation chips */}
            <div data-s="spacing" className="hs__spacing">
              <i className="hs__tick" style={{ top: 0 }} />
              <i className="hs__tickline" />
              <i className="hs__tick" style={{ top: 38 }} />
              <span className="hs__pill">24px</span>
            </div>
            <div data-s="mirror" className="hs__mirror">
              <span data-s="mirrortext" className="hs__chip hs__chip--static">
                mirror
              </span>
            </div>

          </div>

          {/* Act 2: the new tab's page (a project screenshot is added here in JS, desktop only) */}
          <div data-s="view" className="hs__view">
            <div data-s="cap" className="hs__cap" />
          </div>

          {/* Overlay layer (same coordinates as the page layer): handles, ripple, cursor */}
          <div className="hs__over">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} data-s="handle" className="hs__handle" />
            ))}
            {/* Click ripple + cursor */}
            <i data-s="ripple" className="hs__ripple" />
            <div data-s="cursor" className="hs__cursor">
              <svg width="18" height="18" viewBox="0 0 12 18.5" fill="none" focusable="false">
                <path
                  d="M0 0 L0 15.5 L4.2 11.8 L6.9 18 L9.1 17 L6.4 10.9 L11.8 10.9 Z"
                  fill="#0A0A0A"
                  stroke="#fff"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="hs__tag">delyte</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Chrome-style tab outline: curved shoulders that flare into the toolbar. Only the active tab shows it. */
function TabShape({ dataS }: { dataS: string }) {
  return (
    <svg data-s={dataS} className="hs__tabshape" viewBox="0 0 158 28" width="158" height="28" focusable="false">
      <path d="M0 28C7 28 8 27 9 20V9C9 4 12 0 17 0H141C146 0 149 4 149 9V20C150 27 151 28 158 28Z" />
    </svg>
  );
}

function CloseX() {
  return (
    <svg className="hs__x" viewBox="0 0 10 10" width="10" height="10" focusable="false">
      <path d="M2 2l6 6M8 2L2 8" stroke="rgb(10 10 10 / 0.55)" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
