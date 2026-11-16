# hero-v2.md — "design it, build it, ship it"

Status: **IMPLEMENTED** (not yet browser-tested; run `npm run dev` and check §6). Builds on `hero-animation.md`; the original loop is unchanged except where listed here.

## 1. Right side (`features/hero/hero-stage.tsx`)

- **Chrome-style browser.** Tab strip (curved active tab, favicon, title, close, "+"), back / forward / reload, address bar with lock, 2 px loading bar, soft shadow. All HTML + SVG.
- **One constant shift.** Page content lives in `.hs__page` / `.hs__over`, offset **24 px** below the old window coordinates, so every `POS` y-value of the original loop is untouched.
- **Act 1 (tab 1):** the original loop, 0 → 8.15 s (draw the mark, move it into the nav, build the page, press "See my work").
- **Act 2 (scene F, `T.desktop.F`):** new tab opens (8.6) → address bar types the project host → loading bar fills → real screenshot appears (9.5) and scrolls with `sine.inOut` (10.0 → 15.4) while the cursor hovers → cursor clicks the tab's close button (15.65) → tab closes, tab 1 returns (15.75) → scene E collapse and reset (16.5 → ~18.5). Loop ≈ 19 s.
- **Seamless reset.** Tab 2, "+", loading bar, address text and page 2 are all returned to the start state before scene E; `initialState()` sets the same values.
- **Screenshots** come from `lib/data/projects.ts` (entries with `image`). One per loop, advancing on `onRepeat`. The `<img>` is created in JS, desktop + motion only. A short screenshot is zoomed to 1.5 × viewport height so there is always something to scroll. A load error falls back to the project name on grey.
- **Phones / reduced motion:** no matchMedia branch, no loop, no images: the finished tab-1 frame. The old mobile timeline was removed.
- Only `transform`, `opacity`, `clip-path`, `stroke-dashoffset` are animated; the loop pauses off-screen and in hidden tabs (unchanged rules).

## 2. Signal channel (`features/hero/hero-events.ts`)

The stage dispatches `delyte:hero-step` on `window`: `{type:"step", step:0|1|2, duration}` at loop time 0.02 / 5.05 / 8.6 and `{type:"pause", paused}` when the loop pauses or resumes. Nothing on the left imports the stage.

## 3. Left side (desktop ≥ 1024 px, motion allowed, otherwise static markup)

| Piece | File | Behaviour |
| --- | --- | --- |
| Step caption + ring | `hero-steps.tsx` | "Designing the mark → Building the page → Shipping", label rolls through a mask, ring refills per step, pauses with the loop. Invisible until the first signal. |
| Rotating word | `hero-fx.tsx` + `index.tsx` | "engineered." → designed. → animated. → performant. every 2.8 s. All words share one grid cell, so the headline never re-wraps. Screen readers get the static word. |
| Scribble | `index.tsx` + `hero-fx.tsx` | Hand-drawn underline under "thoughtfully", erased and redrawn (DrawSVG) on every `step 0`. |
| Pointer depth | `hero-fx.tsx` | `[data-depth]` wrappers: headline 1, copy 0.6, browser −1.6 (opposite). `gsap.quickTo`, fine pointers only. |
| Grid spotlight | `.hero-spot` in `globals.css` | Orange grid revealed by a radial mask following the pointer (rAF-smoothed `--sx/--sy`). |
| Live strip | `lagos-clock.tsx` | Ticking `Africa/Lagos` time in "Based in"; writes to the DOM, pauses in hidden tabs. |
| Scroll exit | `hero-fx.tsx` | Headline words grouped into rows by `offsetTop`; even rows slide left, odd right, fading out, scrubbed over the first 70 % of the hero. Re-measured on refresh. |

## 4. Files

NEW `hero-events.ts`, `hero-steps.tsx`, `hero-fx.tsx`, `lagos-clock.tsx`, `hero-v2.md`.
CHANGED `hero-stage.tsx`, `index.tsx`, `app/globals.css` (browser chrome, page/overlay layers, `.hero-spot`).
No new dependencies. No new image domains (screenshots are plain `<img>`).

## 5. Tuning

All act-2 times are in `T.desktop.F`; cursor points in `POS.viewIn / drift / tabClose`; depth strength in `data-depth` values and the `* 9` / `* 6` multipliers in `hero-fx.tsx`; word hold time is `HOLD`.

## 6. Test checklist

1. Desktop: tab 1 plays as before, then a second tab opens, URL types, screenshot scrolls, tab closes, collapse runs, loop restarts with no jump.
2. Next loop shows the next project (title + host change).
3. Caption follows the three steps; scribble redraws at each loop start; both pause when scrolled away.
4. Window narrower than 1024 px: no caption, no rotation, no spotlight, scribble hidden; stage still loops (≥ 768 px).
5. Phone or reduced motion: static browser frame, no screenshots requested (Network tab).
6. Scroll out of the hero: rows slide apart and fade; scroll back: they return.
