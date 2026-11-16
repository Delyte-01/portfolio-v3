# animated.md — Delyte loading screen (strict spec)

Status: **IMPLEMENTED** (`components/loader/`, hooked up in `app/layout.tsx` and `components/motion/page-motion.tsx`).
This file stays the single source of truth for the loader; change it first, then the code.
Follow it exactly. Where it says MUST / MUST NOT, there is no discretion.
If something here conflicts with a guess or a "nicer idea", this file wins.

The logo SVG was supplied and converted. Notes on how it was handled (**[SVG]**):
- It was a Fabric.js export: an 8-petal icon (`b`–`i`) + 6 outlined letter paths + one invisible `<text>`
  helper node (dropped). Nested transforms were flattened into one matrix per path.
- Colours kept as in the file: icon `#FF6A3D`, wordmark and rule `#D72B0C`.
- The hairline rule lives inside the SVG (under the wordmark), so it always matches its width.
- Implementation notes: `<Loader />` is mounted as the first child of `<SmoothScroll>` (it needs the Lenis
  context for the scroll lock). At the reveal moment it sets `html[data-loader="done"]` so returning to `/`
  by client-side navigation never pauses the hero. A CSS failsafe hides the overlay after 8 s if JS never runs.
- The tagline is `site.role · site.location` as specified; it is long, so it wraps to two centred lines.
  To shorten it, change the text in `components/loader/index.tsx`.

---

## 0. Before writing any code

1. `AGENTS.md` says this Next.js has breaking changes. Read the relevant guides in
   `node_modules/next/dist/docs/` first (root layout `<head>`, `<script>`, client components).
2. Run `npm install` and make sure `npm run dev` works before touching anything.
3. Read `lib/gsap.ts` (eases `silk`, `glide`, `settle`), `components/motion/page-motion.tsx`
   (hero timeline) and `components/lenis/index.tsx`. The loader MUST reuse these.

## 1. Goal

A minimal, sleek, movie-title-style intro. White screen, the **icon** appears first, then the word
**delyte** rises letter by letter (d, e, l, y, t, e), a hairline rule draws under it, a tiny
tagline and counter appear, then everything lifts away and a white curtain wipes up to reveal the
hero while the hero headline is already rising.

Feel: calm, confident, slow-in/slow-out. Nothing bounces. Nothing is aggressive.

## 2. Files to create / change

| File | Action |
| --- | --- |
| `public/brand/delyte-logo.svg` | Add the original SVG here (kept as the source of truth). |
| `components/loader/logo-mark.tsx` | NEW. The SVG converted to an **inline** React SVG (see §4). |
| `components/loader/index.tsx` | NEW. `"use client"` loader overlay + GSAP timeline. |
| `app/layout.tsx` | Mount `<Loader />` as the first child inside `<body>`; add the head script (§5). |
| `app/globals.css` | Add the loader CSS (§9). |
| `components/motion/page-motion.tsx` | Gate the hero timeline on the loader (§8). |
| `V3-PROGRESS.md`, `README.md` | Tick the loader phase and document it in the Motion section. |

MUST NOT: add dependencies, add fonts, use `<img>`/`next/image` for the logo (GSAP must target
its parts), use any plugin other than the already-registered ones.

## 3. Palette and type

| Token | Value | Use |
| --- | --- | --- |
| Screen background | `#FFFFFF` | Loader panel |
| Logo fill | **the exact hex found in the SVG** (about `#D72B0C`; if it differs, use the SVG's) | Icon + wordmark, via `fill="currentColor"` and `color` on the wrapper |
| Rule + dot accents | same as logo fill | Hairline rule |
| Small text | `#0A0A0A` at 60% opacity | Tagline, counter |
| Tagline / counter font | existing Montserrat (`var(--font-body)` or whatever `app/font.ts` exposes) | `t-meta` style: uppercase, `letter-spacing: 0.14em`, `font-size: 0.6875rem` |

The logo is outlined paths, so **no new font is needed**. Counter uses `font-variant-numeric: tabular-nums`.
Do not change the site accent colour to match the logo unless the owner asks.

## 4. The SVG **[SVG]**

Convert the SVG to an inline component `LogoMark` with these rules:

1. Keep the original `viewBox`. Remove fixed `width`/`height`; size it with CSS (§9).
2. Replace all hard-coded fills with `currentColor`. If there are several colours, keep them as-is
   and report it in the PR notes.
3. Give each part a stable `data-part` attribute so GSAP can target it:
   - icon (the whole group left of the text): `data-part="icon"`; if it is made of several shapes,
     give each shape `data-part="icon-piece"`.
   - letters, in reading order: `data-part="letter"` plus `data-i="0"`… `data-i="5"`
     (d, e, l, y, t, e).
4. Add `aria-hidden="true"` and `focusable="false"` to the SVG. The overlay carries the label.
5. If the SVG contains `<text>`, convert it to outlines first. Do not ship live text.
6. **Fallback: the wordmark is ONE combined path.** Do not hand-split it. Instead animate it with a
   left-to-right masked wipe: an SVG `<clipPath><rect/></clipPath>` whose `width` goes `0 → full`
   with ease `glide`, over the same time window as the letter rise (§6, 0.30 s → 1.30 s). Say so in
   the PR notes.
7. Add a clip rect that covers the logo's full bounding box **plus 25% extra at the bottom** so the
   descender of the "y" is never cut off, and apply it to the letters group (`clip-path`). This is
   the "mask" the letters rise from.

## 5. When the loader plays (strict rules)

The loader plays **only** when ALL are true:
- first visit in this browser session: `sessionStorage` key `delyte:loaded` is not set,
- `prefers-reduced-motion: no-preference`,
- the current route is `/` (NOT `/work/[slug]`).

Otherwise it is skipped with **no flash**. To guarantee that, add a tiny inline script in the root
layout `<head>` that runs before paint:

```js
(function () {
  try {
    var skip =
      sessionStorage.getItem("delyte:loaded") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      location.pathname !== "/";
    document.documentElement.setAttribute("data-loader", skip ? "skip" : "play");
  } catch (e) {
    document.documentElement.setAttribute("data-loader", "skip");
  }
})();
```

- No-JS safety: add `<noscript><style>.loader{display:none!important}</style></noscript>` so the site is
  never covered when JavaScript is off.
- The overlay is rendered in the server HTML (visible by default, `position: fixed; inset: 0`), and
  CSS hides it when `html[data-loader="skip"]`. This is what prevents a flash of the page.
- After the loader finishes (or is skipped), set `sessionStorage["delyte:loaded"] = "1"` and
  **unmount the overlay** (state `done = true` → render `null`). It MUST NOT stay in the DOM.

## 6. Timeline: desktop (min-width 768px)

One `gsap.timeline()` created in `useGSAP`, scoped to the loader ref, wrapped in `gsap.matchMedia`
(§7 for the mobile branch). Times are in seconds from timeline start. Ease names are the existing
custom eases from `lib/gsap.ts`.

**Initial state (set synchronously before first paint, in `useGSAP`, i.e. a layout effect):**
- icon pieces: `scale: 0`, `transformOrigin: "50% 50%"`, `autoAlpha: 0`
- letters: `y: logoHeight * 1.2` (user units, NOT `yPercent`), `autoAlpha: 0`
- rule: `scaleX: 0`, `transformOrigin: "0% 50%"`
- tagline: `autoAlpha: 0`, `y: 8`
- counter: text `000`, `autoAlpha: 0`

**Entrance**

| t | What | Props | Dur | Ease |
| --- | --- | --- | --- | --- |
| 0.00 | Icon pieces appear | `scale 0→1`, `autoAlpha 0→1`, stagger `0.06` | 0.70 | `settle` |
| 0.30 | Letters rise, one by one | `y → 0`, stagger `0.09` (order d, e, l, y, t, e) | 1.00 | `silk` |
| 0.30 | Letter opacity | `autoAlpha 0→1`, stagger `0.09` | 0.45 | `silk` |
| 0.85 | Hairline rule draws | `scaleX 0→1` | 0.90 | `glide` |
| 0.95 | Tagline | `autoAlpha 0→1`, `y 8→0` | 0.80 | `silk` |
| 0.20 | Counter fades in | `autoAlpha 0→1` | 0.50 | `silk` |
| 0.20 | Counter value | tween a number object `0→100`, write `Math.round(n)` padded to 3 digits | 1.40 | `glide` |

**Hold:** nothing moves until `t = 1.60` **and** the page is ready (see "Ready gate" below).

**Exit**

| t | What | Props | Dur | Ease |
| --- | --- | --- | --- | --- |
| 1.60 | Tagline, rule, counter leave | `autoAlpha → 0`, `y → -8` (rule: `scaleX 1→0`, origin `100% 50%`) | 0.40 | `glide` |
| 1.65 | Letters lift out | `y → -logoHeight * 1.2`, stagger `0.05` | 0.70 | `glide` |
| 1.70 | Icon lifts out | `y → -logoHeight * 0.6`, `autoAlpha → 0` | 0.60 | `glide` |
| 1.95 | Curtain wipes up | panel `clipPath: "inset(0% 0% 0% 0%)" → "inset(0% 0% 100% 0%)"` | 0.90 | `glide` |
| 2.25 | **Reveal event** (hero starts) | dispatch, see §8 | 0 | n/a |
| end | Cleanup | set `sessionStorage`, unlock scroll, unmount | n/a | n/a |

Total ≈ **2.6 s** (+ any wait on the ready gate).

**Ready gate (strict).** The exit MUST NOT start before `Promise.all([document.fonts.ready, loadEvent])`
resolves, where `loadEvent` resolves on `window` `load` (or immediately if `document.readyState === "complete"`).
Cap the wait at **4 s**; after that, exit anyway. Implement the hold as: build the entrance timeline,
then `await gate`, then add/play the exit timeline (or `tl.play("exit")` with a label at 1.60).
The counter MUST reach 100 before the exit starts. If the gate resolves early, the exit still waits for
`t = 1.60`.

## 7. Timeline: mobile (max-width 767px) — its own version

Same order and structure, tuned for phones (shorter, lighter, no heavy motion):

- Multiply every **duration** by `0.75` and every **stagger** by `0.8`.
- Letter stagger `0.07`; letter rise distance `logoHeight * 1.0`.
- Logo width: `min(72vw, 320px)`; desktop: `clamp(280px, 30vw, 440px)`.
- Tagline stays but is `0.625rem`; counter moves to bottom-centre instead of bottom-right.
- Curtain wipe is identical (vertical clip) but `0.75 s`.
- Total ≈ **2.0 s**.
- MUST NOT use any pointer, hover or mouse-based effect.
- Use `100svh` for the overlay height so the mobile URL bar never exposes a gap.

## 8. Hand-off to the hero (strict)

The hero timeline in `PageMotion` currently plays immediately. Change it so:

1. On mount, read `document.documentElement.dataset.loader`.
2. If it is `"play"`: create the hero timeline **paused** (`gsap.timeline({ paused: true, ... })`).
   Its `from()` tweens still apply their hidden start state at once, which is correct because the
   loader overlay is covering the page.
3. Listen for `window` event `delyte:reveal` (dispatched by the loader at `t = 2.25` on desktop,
   `t ≈ 1.7` on mobile = when the curtain is about 50% open) and call `hero.play()`.
4. Failsafe: if the event has not fired after **6 s**, call `hero.play()` anyway so content can never
   stay hidden.
5. If it is `"skip"`: behave exactly as today (play immediately).
6. Remove the listener and the timeout in the cleanup function.

## 9. Layout and CSS (strict)

```css
.loader {
  position: fixed;
  inset: 0;
  z-index: 300;                 /* above navbar, progress bar (120) and page wipe (200) */
  display: grid;
  place-items: center;
  height: 100svh;
  background: #fff;
  color: var(--logo-fill, #D72B0C);
  clip-path: inset(0% 0% 0% 0%);
  will-change: clip-path;
}
html[data-loader="skip"] .loader { display: none; }
html.is-loading { overflow: hidden; }
```

- Stack inside `.loader`: logo (centered), rule directly under it (width = 100% of the wordmark,
  `height: 1px`, background current colour), tagline 20 px below the rule, centered.
- Counter: `position: absolute; bottom: 24px; right: 24px` (desktop) / bottom-centre (mobile),
  `color: rgb(10 10 10 / 0.6)`.
- Tagline text: `${site.role} · ${site.location}` from `lib/site.ts` (do not hard-code).
- Wrapper has `role="status"` and `aria-label="Loading Delyte portfolio"`. Everything inside is `aria-hidden`.
- Only animate `transform`, `opacity` and `clip-path`. MUST NOT animate width/height/top/left.

## 10. Scroll lock

- On play start: `document.documentElement.classList.add("is-loading")`, `lenis.stop()` (via `useLenis`),
  and `window.scrollTo(0, 0)`.
- At the reveal event: remove `is-loading` and call `lenis.start()`.
- The user MUST be able to scroll as soon as the curtain starts opening, never earlier.

## 11. Cleanup and robustness

- Wrap everything in `useGSAP` with `scope` = loader ref, and revert on unmount (React strict mode safe:
  running the effect twice MUST NOT play two loaders or double-fire `delyte:reveal`; guard with a ref).
- Unmount the overlay after the curtain tween completes.
- If anything throws or GSAP fails, remove the overlay, set `data-loader="skip"`, and dispatch
  `delyte:reveal` so the hero still appears.
- The loader MUST NOT cause layout shift (it is `fixed`, so the page beneath never moves).

## 12. Acceptance checklist (all must be true)

- [ ] First visit to `/`: loader plays once, hero rises as the curtain opens.
- [ ] Reload in the same tab: **no** loader, no flash, hero plays immediately.
- [ ] Open `/work/<slug>` directly: no loader.
- [ ] `prefers-reduced-motion`: no loader, no flash.
- [ ] JavaScript disabled: site fully visible, no overlay.
- [ ] Letters are your real logo shapes; the "y" descender is never clipped.
- [ ] Icon animates in before the letters and lifts out with them.
- [ ] Mobile (Chrome devtools, 390 × 844): shorter, no gap at the bottom, no horizontal scroll.
- [ ] No scrolling is possible until the curtain starts opening.
- [ ] Throttled to "Slow 4G": exit waits for fonts/load but never longer than 4 s.
- [ ] `npm run lint` and `npm run build` pass. No new dependencies.
- [ ] Lighthouse performance score is not lower than before the loader.

## 13. Tuning knobs

Put all numbers from §6 and §7 in one `const T = { desktop: {...}, mobile: {...} }` object at the top
of `components/loader/index.tsx` so the owner can tweak timing without reading the timeline code.
