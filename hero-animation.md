# hero-animation.md — Hero right side: "the cursor designs the brand, then builds the page"

Status: **IMPLEMENTED** in `features/hero/hero-stage.tsx`. Extended by `hero-v2.md` (browser frame, second act, left-side effects); where they differ, hero-v2.md wins. This file is the single source of truth for the hero stage.
MUST / MUST NOT = no discretion. Timings, eases and structure are fixed. Pixel coordinates may be
nudged by up to ±12 px to look right; timings may not change.

Related specs: `animated.md` (loader). The hero stage starts when the loader reveals the page.

---

## 0. Before writing code

1. `AGENTS.md`: this Next.js has breaking changes. Read the relevant guides in `node_modules/next/dist/docs/`.
2. `npm install`, make sure `npm run dev` works.
3. Read `lib/gsap.ts` (eases `silk`, `glide`, `settle`), `components/motion/page-motion.tsx` (hero timeline,
   `delyte:reveal` hand-off), `components/loader/logo-mark.tsx` (logo geometry), `features/hero/index.tsx`.
4. Confirm the plugins exist: `ls node_modules/gsap/MotionPathPlugin.js node_modules/gsap/DrawSVGPlugin.js`.
   If `DrawSVGPlugin` is missing, draw the stem with `strokeDasharray/strokeDashoffset` instead. If
   `MotionPathPlugin` is missing, stop and report; do not fake curved cursor paths with straight tweens.

## 1. Concept

The right side of the hero becomes a **mini browser window** (decorative, not interactive). A **cursor with an
orange "delyte" name tag** first *draws one petal of the logo mark*, mirrors and rotates it into the full
8-petal icon, drags the icon into the page's nav bar (the letters d-e-l-y-t-e rise beside it), then *builds a
page* under it (card, heading, text, image, orange button), hovers the button (ripple + an `ease: "silk"` chip),
and finally drags the logo back to the centre, where the page collapses and the petals unwind. That end state is
identical to the start state, so the loop is seamless.

Message: "I design the identity and I build the interface around it." Calm and precise. Nothing bounces.

## 2. What changes in the repo

| File | Action |
| --- | --- |
| `features/hero/hero-stage.tsx` | NEW. `"use client"`. Markup + GSAP loop (this spec). Replaces `HeroArt`. |
| `components/brand/logo-parts.ts` | NEW. Move the `ICON` and `LETTERS` path arrays out of `components/loader/logo-mark.tsx` and export them; make `logo-mark.tsx` import them (loader behaviour must not change). |
| `lib/gsap.ts` | Register `MotionPathPlugin` and `DrawSVGPlugin`, export them. |
| `features/hero/index.tsx` | Replace `<HeroArt className="h-auto w-full" />` with `<HeroStage className="h-auto w-full" />`. Keep `[data-hero-visual]` wrapper and `SpinBadge`. |
| `features/hero/hero-art.tsx` | DELETE (after `grep -r "hero-art\|HeroArt"` shows no other users). |
| `components/motion/page-motion.tsx` | Remove ring/core code (see §9). |
| `app/globals.css` | Stage CSS (§4). |
| `README.md`, `V3-PROGRESS.md` | Document / tick. |

MUST NOT: add dependencies or fonts, use images/PNGs for the scene, animate layout properties
(`top/left/width/height`) or use CSS `filter`/blur in the animation.

## 3. Palette and type

| Use | Value |
| --- | --- |
| Window / card surface | `#FFFFFF` |
| Window border, hairlines | `rgb(10 10 10 / 0.12)` |
| Ink, cursor body | `#0A0A0A` |
| Accent (button, name tag, chip text) | `#D72B0C` (`--electric`) |
| Logo icon petals | `#FF6A3D` (as in the logo) |
| Logo letters, nav rule | `#D72B0C` |
| Skeleton bars | `rgb(10 10 10 / 0.12)` |
| Dotted grid | `rgb(10 10 10 / 0.10)` dots |
| Window shadow (static) | `0 30px 60px -20px rgb(10 10 10 / .18), 0 8px 20px -8px rgb(10 10 10 / .08)` |

Heading: `var(--font-heading)` 600, 28 px / 1.1. Everything else: `var(--font-sans)` (Montserrat), 10–12 px.

## 4. Stage geometry (fixed design size)

The stage is an `aspect-[640/520]` wrapper containing an inner div **640 × 520 px**, `position: relative`,
`transform-origin: 0 0`, scaled with `transform: scale(var(--s))`. A `ResizeObserver` on the wrapper sets
`--s = wrapper.clientWidth / 640` (write the CSS variable directly, no React state). **All numbers below are
design pixels inside this 640 × 520 box.** GSAP never transforms the scaled root, only its children.

| Element | Position / size |
| --- | --- |
| Window | left 16, top 16, 608 × 488, radius 16 |
| Chrome bar | height 44. Dots at cx 40/58/76, cy 38, r 5 (`rgb(10 10 10 / .15)`). URL pill x 176, y 26, 288 × 24, radius 12, text `new URL(site.url).host`, 10 px, centred |
| Nav row | y 60 → 112. Hairline at y 112 |
| Nav logo icon slot | top-left (44, 72), 30 × 30 |
| Nav wordmark slot | top-left (82, 76), 65 × 22, `overflow: hidden` (letters rise inside it) |
| Nav links | three bars 36 × 6, radius 3, at x 360 / 412 / 464, y 84 |
| Nav CTA pill | x 520, y 74, 80 × 26, radius 13, fill `#0A0A0A` |
| Dotted grid | in the canvas (y 112 → 504). Dots every 16 px, 1 px. It lives on a 672 × 520 layer so it can drift |
| Card | x 88, y 150, 464 × 290, radius 14, border 1 px hairline, white, soft shadow |
| Heading (2 lines, each in a clip mask, 31 px tall) | x 116, y 178: "Crafted with care," / "built to move." |
| Paragraph bars | x 116, y 262 (300 × 8) and y 280 (220 × 8), radius 4 |
| Image block | x 392, y 178, 132 × 132, radius 10, orange gradient (`#FF6A3D` → `#D72B0C`) |
| Avatar + 2 bars | circle 28 px at x 392, y 330 + bars to its right |
| Button | x 116, y 372, 128 × 40, radius 20, `#D72B0C`, label "See my work" 12 px white 600 |
| Chip | x 260, y 380, `ease: "silk"`, 11 px, `#D72B0C` on `rgb(215 43 12 / .08)`, radius 8, padding 6 × 10 |
| Spacing chip | centred at (320, 131): "24px", 10 px, ink pill, white text, with two 1 px tick lines (y 112→150) |
| Logo icon layer (stage A) | a div 190 × 190 with top-left (225, 205): centre (320, 300). Contains an SVG with `viewBox="114.8 275.7 217.6 217.6"` and the 8 petals |
| Cursor start | (596, 476), `autoAlpha: 0` |

**Logo units → stage px (stage A icon layer):** `px = 225 + (u − 114.8) × 0.873`, `py = 205 + (v − 275.7) × 0.873`.

### Cursor
SVG pointer, 18 px: path `M0 0 L0 15.5 L4.2 11.8 L6.9 18 L9.1 17 L6.4 10.9 L11.8 10.9 Z`, fill `#0A0A0A`,
1.5 px white stroke. Name tag: pill at offset (14, 16), `#D72B0C`, white "delyte" 10 px 600, radius 6, padding 3 × 8.
Cursor `left/top: 0`, `will-change: transform`; positioned only by GSAP `x/y`. Press = `scale: 0.9` (0.12 s) then back.

### Ripple
A 28 px circle, 1.5 px `#D72B0C` border, placed with `gsap.set` at the click point; tween `scale 0.4 → 1.6`,
`autoAlpha 0.5 → 0`, 0.7 s, `silk`. Re-used (one element) for every click.

### Brand parts [SVG]
- Petals: the 8 paths from `logo-parts.ts` in original order `b, c, d, e, f, g, h, i`. Each in its own
  `<g data-stage="petal" data-i="0..7">`. Geometry facts (logo units): ring centre (223.6, 384.5); icon bbox
  x 114.8–332.4, y 275.7–493.3. The icon is **four mirrored pairs**: (b, i), (c, d), (e, f), (g, h); each pair is
  the previous one rotated 90°. Petal `b`'s stem centre-line is `M250.1 398 L250.1 480` (22 px wide, round caps).
- Letters: the 6 paths in a separate SVG, `viewBox="368.7 305.8 462.3 157.4"`, each in
  `<g data-stage="letter" data-i="0..5">` (d, e, l, y, t, e).
- Colours stay as in the logo. No `<text>`.
- Stem stroke: an extra `<path d="M250.1 398 L250.1 480">` inside the icon SVG, `stroke #FF6A3D`, width 22,
  `stroke-linecap: round`, `fill: none`, used only for the "drawing" moment.

## 5. Initial (= final) state

Set synchronously before first paint (inside `useGSAP`, a layout effect):

- window: `autoAlpha 0`, `y 24`, `scale 0.97` (this is the one-off intro, §6.0)
- cursor: `autoAlpha 0`, `x 596`, `y 476`
- stem: `drawSVG "0%"`, `autoAlpha 1`; petals: `scale 0`, `autoAlpha 0`, `transformOrigin "50% 50%"` (SVG centre of icon)
- icon layer: at stage A position (centre), `scale 1`, `rotation 0`
- nav links, CTA pill, nav hairline (`scaleX 0`, origin left): hidden; letters: `y 28`, `autoAlpha 0`
- card: `clipPath inset(0 100% 100% 0)`, all card children `autoAlpha 0`; handles, chips, ripple: `autoAlpha 0`
- grid layer: `x 0, y 0`

Every loop **ends in exactly this state** (except the window, which stays visible after the intro).
The SSR/no-JS markup is the **finished frame** (nav + logo + card built, cursor hidden) so reduced-motion and
no-JS visitors see a complete picture. JS applies the hidden state only when motion is allowed.

## 6. Timeline: desktop (min-width 768px) — total 11.0 s, `repeatDelay` 0.4

Eases are the custom eases from `lib/gsap.ts`. "Move" = a `MotionPath` tween on the cursor with
`curviness: 1.25`, ease `glide`. Times are absolute seconds on the **loop timeline**.

### 6.0 Intro (plays once, before the loop; not repeated)
Window: `autoAlpha 1`, `y 0`, `scale 1`, 1.1 s, `silk`. Then start the loop 0.3 s later.
The grid layer drifts forever, independently: `x: -16, y: -16`, 8 s, `ease: "none"`, `repeat: -1` (one tile, seamless).

### Scene A: draw the mark (0 → 3.4)
| t | What | Details |
| --- | --- | --- |
| 0.00 | Cursor appears | `autoAlpha 0→1`, 0.3 s, `silk` |
| 0.20 → 1.30 | Cursor moves | (596,476) → (470,400) → (343,312) |
| 1.30 | Click | press + ripple at (343, 312) |
| 1.40 → 2.00 | Stem is drawn | `drawSVG "0%" → "100%"` 0.6 s `glide`; cursor moves (343,312) → (343,383) in lock-step |
| 2.00 | Stem becomes petal 0 | stem `autoAlpha → 0` (0.25 s); petal `b` `scale 0.85→1`, `autoAlpha 0→1` (0.35 s, `settle`) |
| 2.00 | Mirror | petal `i` appears (same tween, stagger 0). Chip "mirror" fades in at (320, 170) |
| 2.35 / 2.70 / 3.05 | Rotate ×4 | pairs `(d,c)`, `(f,e)`, `(h,g)` appear: `scale 0.85→1`, `autoAlpha 0→1`, 0.6 s `settle`. Chip text switches to "×4 · 90°" at 2.35 |
| 2.00 → 3.40 | Cursor orbit | (343,383) → (401,359) → (261,381) → (239,241) → (379,219) → (320,300). Times: 2.00, 2.35, 2.70, 3.05, 3.40 |
| 3.30 | Chip out | `autoAlpha → 0`, 0.3 s |

### Scene B: logo becomes the header (3.4 → 5.0)
| t | What | Details |
| --- | --- | --- |
| 3.40 | Grab | cursor press (0.12 s) |
| 3.50 → 4.40 | Icon flies to nav | icon layer `transformOrigin "0 0"`; `scale 190→30 px (0.158)`, to top-left (44, 72): `x −181`, `y −133`; 0.9 s `glide`. Cursor rides along: (320,300) → (58, 100) |
| 4.20 → 5.00 | Letters | `y 28 → 0`, `autoAlpha 0 → 1` (0.45 s), stagger 0.07, 0.7 s `silk` |
| 4.40 → 5.00 | Nav furniture | hairline `scaleX 0→1` (0.8 s `glide`), links `scaleX 0→1` origin left (stagger 0.06, 0.6 s `silk`), CTA pill `autoAlpha 0→1, scale 0.9→1` (0.6 s `settle`) |

### Scene C: build the page (5.0 → 7.4)
| t | What | Details |
| --- | --- | --- |
| 5.05 → 5.55 | Cursor to card corner | (58,100) → (88,150) |
| 5.55 | Click | press + ripple |
| 5.60 → 6.50 | **Card is dragged out** | ONE tween on a progress object `p: 0 → 1`, 0.9 s `glide`. In `onUpdate`: card `clipPath = inset(0 {(1−p)·464}px {(1−p)·290}px 0)` (in %: `(1−p)·100`), cursor `x = 88 + 464p`, `y = 150 + 290p`, the 4 corner handles (6 px white squares, 1 px ink border) follow the clipped rectangle's corners. Handles fade in at 5.60 and out at 6.50 (0.3 s) |
| 6.50 | Spacing chip | "24px" `autoAlpha 0→1`, `y 6→0`, 0.4 s `silk`; out at 7.30 (0.3 s) |
| 6.55 → 7.50 | Heading | each line's inner text `yPercent 105 → 0`, stagger 0.1, 0.9 s `silk` (masked) |
| 6.90 | Paragraph bars | `scaleX 0→1`, origin left, stagger 0.08, 0.7 s `silk` |
| 7.00 | Image + avatar | image: `clipPath inset(100% 0 0 0) → inset(0)`, 0.8 s `glide`; avatar group `x −12 → 0`, `autoAlpha 0→1`, 0.7 s `silk` |
| 7.20 | Button | `scale 0.9→1`, `autoAlpha 0→1`, 0.7 s `settle` |

### Scene D: interact (7.2 → 9.0)
| t | What | Details |
| --- | --- | --- |
| 7.20 → 7.90 | Cursor to button | (552,440) → (480,430) → (180, 392) |
| 7.90 | Hover | button `y −3` (0.4 s `silk`), its pre-rendered shadow layer `autoAlpha 0→1` |
| 8.00 → 8.50 | Chip | `ease: "silk"` chip `autoAlpha 0→1`, `y 6→0`, 0.5 s `silk` |
| 8.15 | Press | cursor press + ripple at (180, 392); button `scale 0.97` (0.12 s) then 1 (0.4 s `settle`) |
| 8.50 → 9.00 | Hold | nothing moves |

### Scene E: collapse and reset (9.0 → 11.0)
| t | What | Details |
| --- | --- | --- |
| 9.00 → 9.60 | Cursor to nav icon | (180,392) → (60, 100) |
| 9.30 → 9.90 | Page fades | chip, button, image, avatar, paragraph, heading, card (in that order, stagger 0.04): `autoAlpha → 0`, `y −6`, 0.5 s `glide`; card `clipPath → inset(0 100% 100% 0)` 0.5 s |
| 9.50 → 10.10 | Nav fades | links, CTA, hairline `autoAlpha → 0` (0.4 s); letters `y 0 → 28`, `autoAlpha → 0`, reverse stagger 0.04, 0.5 s `glide` |
| 9.70 → 10.40 | Icon returns | icon layer back to centre: `x 0, y 0, scale 1`, 0.7 s `glide`; cursor rides along to (320, 300) |
| 10.40 → 11.00 | Petals unwind | icon `rotation 0 → 90` (0.6 s `glide`; the icon is 4-fold symmetric so the loop is seamless), petals `scale → 0`, `autoAlpha → 0`, stagger 0.05, 0.5 s `settle`; cursor → (596, 476); cursor `autoAlpha → 0` from 10.80 (0.2 s) |
| 11.00 | Reset | `tl.set(iconLayer, { rotation: 0 })`, stem `drawSVG "0%"` (invisible, so this is safe) |

Cursor motion rules: every travel is a curved `MotionPath` (never a straight line), `glide` easing, a 0.12 s
press on each click, no overshoot.

## 7. Timeline: mobile (max-width 767px) — total ≈ 8.0 s incl. `repeatDelay` 0.4

Same stage, same design size and scaling. Simpler and quieter:

| t | What |
| --- | --- |
| 0.00 | Cursor in (0.3 s) and moves (596,476) → (401,359) → (320,300) by 1.3 s |
| 0.40 → 1.60 | **No stem drawing.** Petals appear pair by pair (b+i at 0.4, d+c at 0.7, f+e at 1.0, h+g at 1.3), 0.5 s `settle`. Chip "×4 · 90°" in at 0.9, out at 1.9 |
| 1.90 → 2.70 | Icon flies to nav (0.8 s `glide`), cursor rides along |
| 2.40 → 3.10 | Letters rise (stagger 0.06, 0.6 s `silk`); nav furniture fades in with it (0.5 s) |
| 3.20 → 4.00 | **Card appears already built**: whole card group `autoAlpha 0→1`, `y 14→0`, 0.8 s `silk` (no drag, no heading rise, no handles, no spacing chip) |
| 4.20 → 5.00 | Cursor to button |
| 5.00 → 5.60 | Hover + press + ripple; `ease: "silk"` chip in |
| 6.20 → 7.60 | Collapse, icon return, petals unwind: same as Scene E but each duration ×0.75 |

- Shadows on the window are lighter on mobile: `0 16px 32px -16px rgb(10 10 10 / .16)`.
- No pointer or hover based effects anywhere.

## 8. Behaviour rules

- **Start:** the stage component listens for `delyte:reveal` if `html[data-loader="play"]`, otherwise starts
  immediately. Failsafe: start after 6 s regardless. Intro 6.0 then loop.
- **Pause off-screen:** `ScrollTrigger.create({ trigger: wrapper, start: "top bottom", end: "bottom top",
  onToggle: s => loop.paused(!s.isActive) })`. Also pause while `document.hidden`.
- **Reduced motion:** no timeline at all; the SSR finished frame is shown. (`prefers-reduced-motion: reduce`.)
- **Accessibility:** the whole stage is `aria-hidden="true"`, `role="presentation"`, contains no focusable
  elements, no links, no inputs. The URL, heading and button text are decorative.
- **Performance:** only `transform`, `opacity`, `clip-path` and stroke dash offset are animated. `will-change`
  only on the cursor and the window. No filters, no blur, no animated shadows. At most one `ResizeObserver`.
- **Robustness:** build everything inside `useGSAP` with `scope`; wrap in `gsap.matchMedia` (desktop and mobile
  branches); revert on unmount; guard against React strict-mode double-run (the first run's timeline, listeners
  and observers must be fully cleaned up). If GSAP or a plugin throws, leave the SSR finished frame visible.
- **Layout shift:** none. The wrapper reserves its aspect ratio (`aspect-[640/520]`) before JS runs.

## 9. Changes inside `components/motion/page-motion.tsx`

1. Delete the two hero tweens targeting `[data-hero-core]` and `[data-hero-ring]`.
2. Delete the whole "Rings drift toward the pointer" block (`finePointer` hero parallax).
3. Change the position of the `[data-hero-meta] > div` tween from `"-=0.9"` to `"-=0.6"`.
4. Do NOT add an entrance tween for `[data-hero-visual]`: the stage runs its own window intro (§6.0), so the wrapper must not be animated twice.
5. Keep the desktop scroll parallax on `[data-hero-visual]` (`yPercent: -6`).
6. Update the comment header (`data-hero-*` list) to match.

## 10. Layout notes

- Desktop: the right column is `lg:col-span-5`; the stage fills it (about 500 px wide, scale ≈ 0.78).
- Mobile: the stage sits under the CTA buttons at full container width (scale ≈ 0.55). Do not crop it.
- `SpinBadge` stays at the bottom-left of the wrapper and must remain above the window (`z-index`).
- Keep `data-hero-visual` on the wrapper.

## 11. Acceptance checklist (all must be true)

- [ ] After the loader, the window fades in and the loop starts; first visit and later visits behave the same.
- [ ] The cursor never moves in a straight line and never overshoots.
- [ ] The icon built on screen is visually identical to the real logo icon (check against `public/brand/delyte-logo.svg`).
- [ ] The "y" descender is not clipped when the letters rise in the nav.
- [ ] The card "resize" drag: the cursor stays on the card's bottom-right corner for the whole drag.
- [ ] The end of each loop matches its start (no pop, no leftover element, icon not rotated).
- [ ] No console errors in strict mode; navigating away and back leaves no duplicate timelines.
- [ ] Mobile (390 × 844): shorter 8 s version, no horizontal scroll, text inside the stage is legible enough to read as UI.
- [ ] Reduced motion: single finished frame, no motion.
- [ ] Scrolled off-screen: the loop is paused (check the GSAP global timeline / CPU).
- [ ] `npm run lint` and `npm run build` pass; no new dependencies; Lighthouse performance not lower than before.

## 12. Tuning knobs

Put every time and distance from §6 and §7 in one `const T = { desktop: {...}, mobile: {...} }` at the top of
`hero-stage.tsx`, and every coordinate in a `const POS = {...}` object, so the owner can adjust the feel without
reading the timeline code.
