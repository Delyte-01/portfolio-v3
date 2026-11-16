# gsap-animation.md — Desktop micro-interactions, Selected Work → Contact

Status: **IMPLEMENTED** (needs `npm install`, `npm run build`, `npm run lint` and a browser pass against §8; see
"Implementation notes" at the end for the few places where the code deliberately differs from the text below).
This file is the single source of truth for the desktop-only micro-interaction
layer. MUST / MUST NOT = no discretion. Durations, eases and numbers are fixed; pixel offsets may be nudged
by up to ±20 % if it looks better, but not the structure.

Related specs: `hero-animation.md` (hero stage), `animated.md` (loader). Scope here starts at the **Selected Work**
section and ends at the **Contact** section (plus the footer logo and global cursor). Hero, loader and phones are
not touched.

---

## 0. Before writing code

1. `AGENTS.md`: this Next.js has breaking changes. Read the relevant guides in `node_modules/next/dist/docs/`.
2. `npm install`, make sure `npm run dev` works.
3. Read, in this order: `lib/gsap.ts` (plugins + eases), `components/lenis/index.tsx` (Lenis driven by the GSAP
   ticker, `ScrollTriggerSync`), `components/motion/page-motion.tsx` (the existing scroll reveals, marquee rate
   controller, magnetic buttons), `features/work/*`, `features/about/index.tsx`, `features/expertise/index.tsx`,
   `features/experience/index.tsx`, `features/contact/index.tsx`, `features/footer/index.tsx`,
   `features/work/archive-preview.tsx` (a finished example of the pointer-follow pattern used here).
4. Confirm the plugins exist (GSAP >= 3.13 ships them all, the repo has `^3.15.0`):
   `ls node_modules/gsap/Draggable.js node_modules/gsap/ScrambleTextPlugin.js node_modules/gsap/SplitText.js`.
   If `ScrambleTextPlugin` is missing, skip F11's scramble (keep the rest). If `Draggable` is missing, skip F7's drag.

## 1. Goals and hard rules

Make the page feel alive with **small, precise, optional** motion. Nothing here may be required to use the site.

**Desktop gate (MUST).** Every effect in this file runs only inside this media query and nowhere else:

```
(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)
```

Phones, tablets, touch laptops in tablet mode and reduced-motion users get **exactly the current site**. No extra
listeners, no extra DOM work, no extra tweens. (1024 px, not 768 px, because several effects need room.)

**Performance budget (MUST).**
- Animate only `transform` (x, y, scale, rotation, skew, rotationX/Y), `opacity`, `clip-path`, `stroke-dashoffset`,
  `background-size` on small marker elements, and CSS custom properties that feed `transform`/`opacity`/gradients on
  an overlay. **MUST NOT** animate `width`, `height`, `top`, `left`, `margin`, `padding`, `box-shadow` or `filter`.
- Pointer-driven motion uses `gsap.quickTo` / `gsap.quickSetter` created **once**, never `gsap.to` per mousemove.
- No `getBoundingClientRect()` inside a pointermove handler except on the single element the pointer is over,
  and at most once per animation frame (cache it on `pointerenter`, refresh on `scroll`/`resize`).
- One `pointermove` listener per section (event delegation), passive, never one per element.
- `will-change` is set only while an element is being interacted with (set on enter, removed on leave).
- Everything off-screen is idle: ScrollTrigger `onToggle` or `IntersectionObserver` pauses loops and listeners.
- Target: stays at 60 fps with Chrome DevTools CPU throttled **4x** while moving the pointer over every effect.

**Behaviour rules (MUST).**
- Native cursor stays visible and `cursor:` CSS is never changed. The custom cursor is an accessory.
- Every hover effect has a keyboard equivalent where the effect carries meaning (focus shows what hover shows),
  otherwise the effect is purely decorative and needs none.
- All effects are `aria-hidden`/decorative and never change reading order, focus order or link targets.
- Every `init` returns a cleanup. Navigating to `/work/[slug]` and back, React strict-mode double mounts and a
  resize across the 1024 px boundary must leave **zero** leaked listeners, tweens, ScrollTriggers or DOM nodes.
- Never `ScrollTrigger.normalizeScroll`, never `scroll-behavior: smooth` (Lenis owns scrolling).

## 2. The custom easing: **"sleek"**

The site already has `silk` (instant start, very long tail), `glide` (symmetric), `settle` (ultra-long tail) and
`pop` (small overshoot). Hover motion needs one more curve: **no jerk at the start, long glide at the end**, so
it still feels smooth right after Lenis has been easing the scroll underneath it.

### 2.1 Add to `lib/gsap.ts` (inside the existing `if (typeof window !== "undefined")` block)

```ts
// Sleek family: smooth acceleration (no instant jump), long glide to rest. Pairs with Lenis' lerp scroll.
CustomEase.create("sleek", "0.2, 0, 0, 1");            // default for hover in, reveals, state changes
CustomEase.create("sleekOut", "0.3, 0, 0.8, 0.15");    // accelerating exit: things leaving, fades out
CustomEase.create("sleekSpring", "0.34, 1.3, 0.5, 1"); // release / snap-back with a tiny (~3 %) overshoot
```

and to the `EASE` object:

```ts
sleek: "sleek",
sleekOut: "sleekOut",
sleekSpring: "sleekSpring",
```

Update the comment block above the eases so the new three are documented next to `silk/glide/settle/pop`.

### 2.2 When to use which ease (MUST follow)

| Situation | Ease | Typical duration |
| --- | --- | --- |
| Hover in (tilt, lift, flip, wave, color) | `sleek` | 0.5 – 0.9 s |
| Hover out / things leaving / fade out | `sleekOut` for fades, `sleek` for returns | 0.35 – 0.6 s |
| Release after drag, magnetic snap-back | `sleekSpring` | 0.9 – 1.2 s |
| `quickTo` pointer smoothing (follow effects) | `silk` (already tuned for follow) | 0.5 – 0.9 s |
| First-time reveal when scrolled into view (`once`) | `silk` (existing) or `sleek` | 0.7 – 1.2 s |
| Pop-in of small floating things | `pop` | 0.5 – 0.7 s |
| **Scrubbed** tween (`scrub` set) | **`"none"`** | n/a |

### 2.3 ScrollTrigger + Lenis rules (MUST)

Lenis already eases the scroll position (`lerp: 0.085`) and the repo already calls `ScrollTrigger.update()` on every
Lenis scroll (`ScrollTriggerSync`). Therefore:

1. **Scrubbed tweens use `ease: "none"` and `scrub: true`** (or at most `scrub: 0.4`). Eased scrub on top of Lenis'
   lerp is double smoothing and feels laggy/mushy. Timelines driven by `scrub` use `ease:"none"` on every child.
2. **Trigger-based tweens (`once`, `toggleActions`, `onEnter`) use the sleek/silk eases**, 0.6 – 1.2 s.
3. Triggers use `start: "top 87%"` like the rest of the site. Never `clamp(...)` on anything that can already be
   visible at load (a trigger clamped to scroll 0 does not fire until the first scroll; see the case-study fix in
   `page-motion.tsx`: above-the-fold content plays immediately instead).
4. Scroll velocity: `ScrollTrigger.create({ onUpdate: (self) => self.getVelocity() })` (px/s) and `self.direction`
   (1 down, -1 up). Always clamp velocity and always return to 0 on `ScrollTrigger.addEventListener("scrollEnd", ...)`.
5. Programmatic scrolling is `lenis.scrollTo(target, { duration: 1.4, easing: glide })` only (already the default).
6. The page can scroll under a still pointer. `pointermove` does **not** fire then. Any hover effect that depends on
   "which element is under the pointer" re-samples with `document.elementFromPoint(lastX, lastY)` inside one
   `requestAnimationFrame`-throttled `scroll` listener (pattern: `features/work/archive-preview.tsx`).
7. Use `gsap.ticker` (which already drives Lenis) for any per-frame work. No separate `requestAnimationFrame` loops
   except the throttle in rule 6.
8. After anything that changes document height (SplitText revert on a tall block, fonts, images) call
   `ScrollTrigger.refresh()` once, debounced (150 ms). Never inside a pointer handler.
9. Never `pin: true` with transformed ancestors. Sticky headings stay CSS `sticky`.

## 3. Shared infrastructure

### 3.1 New / changed files

| File | Action |
| --- | --- |
| `lib/gsap.ts` | Add the 3 eases (§2.1). Also register `Draggable` and `ScrambleTextPlugin` (`import { Draggable } from "gsap/Draggable"`, `import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"`) and export them. |
| `lib/motion.ts` | NEW. Exports `DESKTOP_FINE` (the media query string from §1) and the helpers in §3.2. |
| `components/motion/desktop-motion.tsx` | NEW. `"use client"`. One `gsap.matchMedia()` under `DESKTOP_FINE`; runs every `init*` below; collects and runs their cleanups. Renders nothing. |
| `components/motion/micro/*.ts` | NEW. One file per effect group (§4). Each exports `function initX(): () => void`. |
| `components/cursor/index.tsx` | NEW. `"use client"`. The custom cursor (F1). Mounted in `app/layout.tsx`. |
| `app/page.tsx` | Mount `<DesktopMotion />` right after `<PageMotion />`. (Case-study pages do not get it, except the cursor from the layout.) |
| `app/layout.tsx` | Mount `<Cursor />` after `<BackToTop />`. |
| `components/motion/page-motion.tsx` | Small edits listed in §5. |
| `app/globals.css` | New classes listed per feature. |
| Feature components | `data-*` hooks and small markup additions listed per feature. |

### 3.2 `lib/motion.ts`

```ts
export const DESKTOP_FINE =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/** Clamp helper re-export so micro modules do not import gsap.utils everywhere. */
export const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));

/** Attach a listener and return its remover (keeps cleanup one-liners). */
export function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement | Window | Document,
  type: string,
  fn: (e: any) => void,
  opts?: AddEventListenerOptions,
): () => void {
  el.addEventListener(type, fn as EventListener, opts);
  return () => el.removeEventListener(type, fn as EventListener, opts);
}

/** Normalised pointer position inside a rect: -1..1 on both axes (0 = centre). */
export const norm = (e: PointerEvent, r: DOMRect) => ({
  nx: clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1),
  ny: clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1),
});
```

(Use a proper generic signature that satisfies the repo's ESLint rules; no `any` in the final code.)

### 3.3 `components/motion/desktop-motion.tsx`

```tsx
"use client";
import { gsap, useGSAP } from "@/lib/gsap";
import { DESKTOP_FINE } from "@/lib/motion";
import { initWorkCards } from "./micro/work-cards";
// ...one import per micro module

export function DesktopMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(DESKTOP_FINE, () => {
      const cleanups = [initWorkCards(), /* ... */];
      return () => cleanups.forEach((fn) => fn());
    });
    return () => mm.revert();
  }, []);
  return null;
}
```

Rules for every `init*` function:
1. Query its own elements with `document.querySelectorAll` **inside the function** (not at module load).
2. If the elements do not exist (other page), return a no-op cleanup immediately.
3. Create tweens/ScrollTriggers/listeners only inside `init*`, push every remover into a local array, return one cleanup.
4. Never touch an element that has `data-reveal` **transform** state while its reveal is running: effects that
   transform an element use an inner element or wait for `gsap.isTweening(el) === false`. (The existing
   `batchIn` writes inline `transform/opacity/visibility/transition` and clears them on complete.)
5. Tailwind v4 `rotate-*`, `translate-*`, `scale-*` utilities set the CSS **individual** properties
   (`rotate`, `translate`, `scale`), which add to GSAP's `transform` instead of fighting it. Use that on purpose.

### 3.4 Data-attribute contract (add these to the markup)

| Attribute | Where | Used by |
| --- | --- | --- |
| `data-cursor="view"` / `"drag"` / `"link"` | project visuals / draggable cards / (links are detected automatically) | F1 |
| `data-tilt` | `ProjectVisual` frame | F2 |
| `data-tilt-shadow`, `data-shine` | `ProjectVisual` shadow layer + shine overlay | F2 |
| `data-tech` | `TechList` `<ul>` | F4 |
| `data-split-hover` | project title `<a>` inside `[data-project] h3`, contact email `<a>` | F3, F15 |
| `data-sticky-head` | the `lg:sticky` wrapper in About and Experience | F6 |
| `data-skill-card`, `data-skill-badge`, `data-chip`, `data-count-to` | Expertise | F8, F9, F10 |
| `data-timeline-line`, `data-dot-pulse`, `data-period`, `data-job` | Experience | F11, F12 |
| `data-magnetic="0.08"` | contact email link (strength override) | F14 (and §5 edit) |
| `data-contact-glow`, `data-copy-email` | Contact | F14, F16 |
| `data-footer-logo` | footer logo wrapper | F18 |

---

## 4. Feature specs

Each feature lists: file, markup/CSS change, exact behaviour, edge cases. Build order is in §7.

### GLOBAL

#### F1 — Custom cursor with context states  (`components/cursor/index.tsx`)

**Goal.** A small follower that grows on links, becomes an orange **"View"** bubble over project visuals and a
**"Drag"** bubble over draggable cards. The native cursor stays.

**Markup (rendered once, fixed, `pointer-events-none`, `z-[150]`, `aria-hidden`):**

```html
<div data-cursor-root class="pointer-events-none fixed left-0 top-0 z-[150] hidden lg:block" aria-hidden="true">
  <div data-cursor-dot  class="absolute -left-[5px] -top-[5px] size-[10px] rounded-full bg-white mix-blend-difference"></div>
  <div data-cursor-bubble class="absolute -left-[44px] -top-[44px] grid size-[88px] place-items-center rounded-full bg-[#D72B0C] text-white">
    <span data-cursor-label class="t-meta"></span>
  </div>
</div>
```

**Behaviour (inside `useGSAP`, under `DESKTOP_FINE` via its own `gsap.matchMedia()`):**
- Initial: root `autoAlpha 0`; dot `scale 1`; bubble `scale 0`. While `html[data-loader="play"]`, stay hidden until
  `delyte:reveal` (or 6 s failsafe), then fade in 0.4 s `sleek`.
- Follow: `dotX/dotY = quickTo(dot, "x"/"y", { duration: 0.18, ease: "silk" })`, `bubX/bubY = quickTo(bubble, "x"/"y", { duration: 0.6, ease: "silk" })`.
  One passive `pointermove` on `window` feeds both. First move: `gsap.set` both to the pointer (no fly-in from 0,0).
- State is decided on `pointerover` (delegated on `document`) with `target.closest("[data-cursor]")` or
  `target.closest("a, button, [role=button], summary")`:

| State | Dot | Bubble | Label |
| --- | --- | --- | --- |
| default | `scale 1`, `autoAlpha 1` | `scale 0` | none |
| link (any `a`/`button`) | `scale 3.4` | `scale 0` | none |
| `data-cursor="view"` | `scale 0` | `scale 1` | `View` |
| `data-cursor="drag"` | `scale 0` | `scale 1` | `Drag` |
| leaving the window (`pointerleave` on `document.documentElement`) | `autoAlpha 0` | `scale 0` | none |

  All state changes: `gsap.to(..., { duration: 0.5, ease: "sleek", overwrite: "auto" })`. Bubble in uses ease `pop`,
  0.55 s. Label text is set with `textContent` right before the bubble scales in.
- `pointerdown`: bubble `scale 0.88` 0.15 s `sleek`; `pointerup`: back to 1 with `sleekSpring` 0.6 s.
- Lenis re-sampling: on `scroll` (rAF-throttled) recompute the state from `elementFromPoint(lastX, lastY)`.
- Hide the whole cursor (autoAlpha 0) when `document.hidden`, on `blur` of the window, and over `iframe`/`select`/`input`/`textarea`.

**Markup changes:** `ProjectVisual` frame gets `data-cursor="view"` (only on cards, i.e. when `badge` is true). The
Expertise/About draggable cards get `data-cursor="drag"` (F7). Remove nothing else.

**Edge cases.** No custom cursor over the archive hover preview (it is `pointer-events-none`, so unaffected). The
existing CSS "View" sticker in `project-visual.tsx` is hidden on desktop with `lg:hidden` once F1 ships (keep it for
tablets/touch where the bubble does not exist). Cleanup removes listeners and sets nothing else.

### SELECTED WORK

#### F2 — Project visual: tilt, shine, shadow that follows  (`micro/work-cards.ts`, `project-visual.tsx`, `globals.css`)

**Markup change in `ProjectVisual`** (cards only, `badge` true): wrap the frame so the hard shadow becomes its own layer:

```tsx
<div className="relative" style={{ "--pop": pop } as React.CSSProperties}>
  <span aria-hidden data-tilt-shadow className="absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-[var(--pop)]" />
  <div data-tilt data-cursor="view" className="relative rounded-2xl border-2 border-foreground bg-card ...(existing classes minus the shadow-[...] classes)">
    ...existing inner content...
    <span aria-hidden data-shine className="pointer-events-none absolute inset-0 opacity-0" style={{ background: "radial-gradient(420px circle at var(--mx,50%) var(--my,50%), rgb(255 255 255 / .22), transparent 55%)" }} />
  </div>
</div>
```

The old `shadow-[8px_8px_0_0_var(--pop)]` and hover shadow classes are removed (the layer replaces them; mobile keeps the same look because the layer is static there). Keep the existing CSS hover lift (`group-hover/project:-translate-x-1 -translate-y-1`) on the frame.

**Behaviour (per `[data-project]`, delegated on the article):**
- `pointerenter` on the visual frame: cache its rect; `gsap.set(frame, { transformPerspective: 900, transformOrigin: "50% 50%" })`; `will-change: transform` on; shine `autoAlpha 0 → 1` 0.5 s `sleek`.
- Create `rx = quickTo(frame, "rotationX", { duration: 0.7, ease: "sleek" })`, `ry = quickTo(frame, "rotationY", ...)`, `sx = quickTo(shadow, "x", ...)`, `sy = quickTo(shadow, "y", ...)`.
- `pointermove` (rAF-coalesced): `{nx, ny} = norm(e, rect)`; `ry(nx * 5)`; `rx(-ny * 5)` (max 5°); shadow `sx(-nx * 5)`, `sy(-ny * 5)` (px, additive to the base 8 px offset); `--mx/--my` of the shine set in px via `gsap.set(shine, { "--mx": px, "--my": py })`.
- `pointerleave`: `rx(0) ry(0) sx(0) sy(0)` using a separate `gsap.to(..., { duration: 1, ease: "sleekSpring" })` for the return (quickTo is only for follow), shine out 0.4 s `sleekOut`, remove `will-change`.
- The image parallax in `page-motion.tsx` runs on the `<img>`; tilt runs on the frame. They do not conflict.

**Edge cases.** Do not tilt while the clip-path reveal on the same card is still running (`gsap.isTweening(inner)`).
Refresh the cached rect on `scroll` (throttled) because Lenis moves the card under the pointer.

#### F3 — Title letter wave  (`micro/work-cards.ts`)

`[data-project] h3 a` (add `data-split-hover`). On first `pointerenter`: `SplitText.create(a, { type: "chars", charsClass: "split-char" })`
(chars must be `display:inline-block`: add `.split-char{display:inline-block}` in `globals.css`; SplitText adds
`aria-label` automatically). Then on every enter:

```ts
gsap.fromTo(chars, { y: 0 }, { keyframes: { y: [0, -8, 0] }, duration: 0.7, ease: "sleek", stagger: { each: 0.018 }, overwrite: "auto" });
```

Skip if a wave is already running. Revert the split in cleanup. Keyboard: also run on `focus-visible` of the link.

#### F4 — Tech chips pop in  (`micro/work-cards.ts`)

Add `data-tech` to the `<ul>` in `TechList`. For each list: `ScrollTrigger.create({ trigger: ul, start: "top 90%", once: true, onEnter })`
→ `gsap.fromTo(ul.children, { autoAlpha: 0, y: 10, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "pop", stagger: 0.05, delay: 0.2, clearProps: "transform,opacity,visibility" })`.
Set the hidden state in `init` (before first paint is not possible here, so apply it only to lists **below the viewport**; lists already in view are left alone).

### ABOUT

#### F5 — Highlighter marker replays on hover  (`micro/about.ts`)

`mark.marker` inside the About blockquote. On `pointerenter` (and `focus` of nothing; decorative), if not tweening:

```ts
gsap.fromTo(mark, { backgroundSize: "0% 100%", backgroundRepeat: "no-repeat" },
  { backgroundSize: "100% 100%", duration: 0.9, ease: "sleek", clearProps: "backgroundSize,backgroundRepeat" });
```

Do nothing until the first reveal has finished (`mark.dataset.ready` is set by the existing reveal's `onComplete`; add that one line in `page-motion.tsx`, see §5).

#### F6 — Sticky heading skews with scroll speed  (`micro/about.ts`, used for About **and** Experience)

Add `data-sticky-head` to the `lg:sticky` wrapper. One shared ScrollTrigger:

```ts
const skewTo = gsap.quickTo(head, "skewY", { duration: 0.6, ease: "sleek" });
ScrollTrigger.create({
  trigger: section, start: "top bottom", end: "bottom top",
  onUpdate: (self) => skewTo(clamp(-2, 2, self.getVelocity() / -600)),
});
ScrollTrigger.addEventListener("scrollEnd", () => skewTo(0)); // remove in cleanup
```

Max ±2°. Never on the heading element itself (SplitText works on it), only on the wrapper.

#### F7 — Fact cards: drag and settle  (`micro/about.ts`)

`#about dl > div` (add `data-cursor="drag"`). Create `Draggable` **lazily on the first `pointerenter` of each card** and only if `!gsap.isTweening(card)` (so it never starts during the reveal):

```ts
Draggable.create(card, {
  type: "x,y", edgeResistance: 0.8, zIndexBoost: true, minimumMovement: 4,
  onPress() { gsap.to(this.target, { scale: 1.04, rotation: 0, duration: 0.4, ease: "sleek" }); },
  onRelease() { gsap.to(this.target, { x: 0, y: 0, scale: 1, rotation: 0, duration: 1.1, ease: "sleekSpring" }); },
});
```

Cards keep their CSS tilt/hover classes (they use the individual `rotate`/`translate` properties). Kill all Draggables in cleanup. Links are not inside these cards, so no click conflict.

### EXPERTISE

#### F8 — Magnetic chips with neighbour nudge  (`micro/expertise.ts`)

Add `data-chip` to each `li` chip and `data-skill-card` to each card.
- One `pointermove` listener on `#expertise` grid, active only while the pointer is over a card (`pointerenter/leave` per card).
- On enter: cache the card's chips' centres (`getBoundingClientRect`, relative to the viewport) once; recache on `scroll` (throttled 100 ms) while inside.
- On move (rAF-coalesced): for each chip in that card, `d = hypot(pointer - centre)`; `s = clamp(0, 1, 1 - d / 130)`;
  target `x = (px - cx) * 0.22 * s`, `y = (py - cy) * 0.22 * s` (max ≈ 10 px). Use one `quickTo` pair per chip created lazily, `duration: 0.5, ease: "sleek"`.
- On card leave: `gsap.to(chips, { x: 0, y: 0, duration: 1, ease: "sleekSpring", stagger: 0.015 })`.
- Chips keep their CSS hover fill. Because chips have `transition-colors` only, there is no transform conflict.

#### F9 — Badge jiggle  (`micro/expertise.ts`)

On `pointerenter` of a card (and `focus-within`): `gsap.fromTo(badge, { rotation: -14, scale: 0.9 }, { rotation: 0, scale: 1, duration: 0.9, ease: "sleekSpring" })`.
Remove the existing CSS `group-hover/skill:-rotate-6 group-hover/skill:scale-110` from the badge so the two do not stack.

#### F10 — "N tools" counter  (`micro/expertise.ts`, `expertise/index.tsx`)

Add under each card's list: `<p className="t-meta opacity-70"><span data-count-to={group.items.length}>{group.items.length}</span> tools</p>`.
Once per card (`ScrollTrigger once, start "top 85%"`): `const o = { n: 0 }; gsap.to(o, { n: target, duration: 1, ease: "sleek", onUpdate: () => el.textContent = String(Math.round(o.n)) })`.
SSR text already shows the final number (no flash without JS); set the text to `0` only inside `init` for cards still below the fold.

### EXPERIENCE

#### F11 — Timeline line draws with scroll, dots pulse  (`micro/experience.ts`, `experience/index.tsx`)

Markup: inside the `<ol>` add as the first child `<span aria-hidden data-timeline-line className="absolute -left-px top-0 h-full w-[2px] origin-top bg-electric" />`.
Inside each dot wrapper add `<span aria-hidden data-dot-pulse className="absolute inset-0 rounded-full border-2 border-electric opacity-0" />` (the dot `span` is `absolute`, so wrap it or add the ring as a sibling positioned identically).

```ts
gsap.fromTo(line, { scaleY: 0 }, { scaleY: 1, ease: "none",
  scrollTrigger: { trigger: ol, start: "top 70%", end: "bottom 70%", scrub: true } });
```

(`ease:"none"`, `scrub:true`: §2.3 rule 1.) For each `li`: `ScrollTrigger.create({ trigger: li, start: "top 70%", once: true, onEnter })` →
`gsap.fromTo(pulse, { scale: 1, autoAlpha: 0.6 }, { scale: 2.8, autoAlpha: 0, duration: 1.1, ease: "sleek" })`.

#### F12 — Active job card + period scramble  (`micro/experience.ts`)

Add `data-job` to the inner card `div` (the bordered one) and `data-period` to the period `span`.
- Desktop baseline: all `[data-job]` `opacity: 0.5`. Per `li`: `ScrollTrigger.create({ trigger: li, start: "top 60%", end: "bottom 40%", onToggle: (self) => gsap.to(job, { opacity: self.isActive ? 1 : 0.5, duration: 0.6, ease: "sleek", overwrite: "auto" }) })`.
- Opacity is set on the inner card, not the `li` (the `li` has `data-reveal`).
- Scramble, once per `li` on first enter: `gsap.to(period, { duration: 0.9, ease: "none", scrambleText: { text: original, chars: "0123456789", speed: 0.6, revealDelay: 0.1 } })`. Add `tabular-nums` to the period span so the width never jumps. Skip if `ScrambleTextPlugin` is missing.

### MARQUEE BANDS

#### F13 — Direction flip and hover slowdown  (`micro/marquee.ts`)

The marquee is CSS-animated and `page-motion.tsx` currently nudges WAAPI `playbackRate`. Negative `playbackRate` on an infinite CSS animation is unreliable, so on desktop the bands move to GSAP **and the existing rate controller in `page-motion.tsx` is removed for `full`** (§5).

For each `.marquee`:
1. Read the loop duration from the first `ul`'s inline `animationDuration` and its direction (`animationDirection === "reverse"`).
2. Set `ul.style.animation = "none"` on its two `ul`s.
3. `const tw = gsap.to(uls, { xPercent: reverse ? 0 : -100, duration, ease: "none", repeat: -1 })`; for reverse bands first `gsap.set(uls, { xPercent: -100 })`.
4. `let base = 1; const ts = gsap.quickTo(tw, "timeScale", { duration: 0.8, ease: "sleek" })`.
5. Scroll: `ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => ts(base * (1 + Math.min(Math.abs(self.getVelocity()) / 900, 1.6)) * (self.direction === -1 ? -1 : 1)) })`; on `scrollEnd` → `ts(base)` (direction returns to normal). Negative `timeScale` on a GSAP tween is fine and reverses smoothly.
6. Hover: `pointerenter` → `base = 0.25; ts(0.25)`; `pointerleave` → `base = 1; ts(1)`.
7. Off-screen: `ScrollTrigger.create({ trigger: band, start: "top bottom", end: "bottom top", onToggle: (s) => tw.paused(!s.isActive) })`.
8. Cleanup: kill tweens/triggers and restore `ul.style.animation = ""`.

### CONTACT

#### F14 — Cursor-following glow on the card  (`micro/contact.ts`, `contact/index.tsx`, `globals.css`)

Inside `[data-contact-surface]` add `<div aria-hidden data-contact-glow className="contact-glow" />` and in CSS:

```css
.contact-glow {
  position: absolute; inset: 0; pointer-events: none; opacity: 0;
  background: radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(255 255 255 / 0.2), transparent 60%);
  mix-blend-mode: soft-light;
}
```

`pointerenter` → glow `autoAlpha 1` 0.5 s `sleek`; `pointermove` (rAF) → `gsap.set(glow, { "--mx": x + "px", "--my": y + "px" })` (card-relative; cache the rect on enter, refresh on scroll); `pointerleave` → `autoAlpha 0` 0.5 s `sleekOut`. The existing 3D tilt in `page-motion.tsx` stays; the glow is a child inside the tilted surface.

#### F15 — Email letter flip + gentle magnet  (`micro/contact.ts`, `contact/index.tsx`)

- Replace the email link's `underline decoration-...` utilities with a background underline (inline-block children lose `text-decoration`):
  `bg-[linear-gradient(currentColor,currentColor)] bg-[length:100%_2px] bg-bottom bg-no-repeat pb-1` and keep `hover` colour behaviour. Add `data-split-hover` and `data-magnetic="0.08"`, and `style={{ perspective: 600 }}`.
- On first `pointerenter`/`focus-visible`: `SplitText.create(a, { type: "chars", charsClass: "split-char" })`. Then each time:

```ts
gsap.fromTo(chars, { rotationX: -90, autoAlpha: 0.2, transformOrigin: "50% 50% -0.4em" },
  { rotationX: 0, autoAlpha: 1, duration: 0.7, ease: "sleek", stagger: 0.015, overwrite: "auto" });
```

- Magnetic strength comes from the attribute via the §5 edit (default 0.18 stays for buttons).
- `break-all` is on the link on small widths; on desktop (>= 1024 px) the email never wraps, so splitting is safe.

#### F16 — Copy email with a dot burst  (`micro/contact.ts`, `contact/index.tsx`)

Add a secondary button after the CTA: `<button type="button" data-copy-email className="relative ...">Copy email</button>` plus a visually hidden `<span role="status" aria-live="polite" className="sr-only" data-copy-status />`.
On click: `await navigator.clipboard.writeText(email)` (fallback: a temporary `textarea` + `document.execCommand("copy")`). Then:
- Label → `Copied` for 1.6 s (swap with a small `y` roll: old text `y -100%`, new text from `y 100%`, 0.5 s `sleek`), live region text set to "Email copied".
- Burst: create 12 `span.size-1.5.rounded-full.bg-white` absolutely positioned at the button centre, append to the button container, then
  `gsap.to(dots, { x: i => cos(a_i) * gsap.utils.random(40, 90), y: i => sin(a_i) * gsap.utils.random(40, 90), scale: 0, autoAlpha: 0, duration: 0.9, ease: "sleek", stagger: 0.01, onComplete: remove })` with angles evenly spaced plus ±12° jitter.
- Disabled while animating (prevents double fire). Works with keyboard (`Enter`/`Space`), so it also bursts for keyboard users.
- This is the only feature in this file that adds a visible button; it is allowed on every device, but the **burst** (GSAP) is desktop-gated. On other devices it just copies and swaps the label.

### GLOBAL EXTRAS

#### F17 — Section numbers count up  (`micro/eyebrows.ts`)

Eyebrow index spans (`[data-eyebrow] > span:first-child` whose text matches `/^\d+$/`, i.e. `01`–`05`). Once on enter (`start: "top 87%"`): count from `00` to the number over 0.9 s `sleek`, formatted with `padStart(2, "0")`. Do not touch the `+` index in the archive. The existing eyebrow tween in `page-motion.tsx` (slide-in) stays; start the count 0.15 s after it.

#### F18 — Footer logo reacts to the pointer  (`micro/footer.ts`, `footer/index.tsx`)

Add `data-footer-logo` to the logo wrapper in the footer. The `Logo` component renders the icon group `.logo-icon` and the wordmark group.
- Within the footer only: icon `rotation` follows the pointer angle slowly: `rotation = clamp(-45, 45, (px - cx) / 12)` degrees via `quickTo(icon, "rotation", { duration: 1.2, ease: "sleek" })` (SVG: `gsap.set(icon, { transformOrigin: "50% 50%", transformBox: "fill-box" })`). Remove the CSS `.logo-link:hover .logo-icon` 90° turn for this instance by not putting `logo-link` on the footer logo wrapper (it is not a link there).
- Wordmark group shifts `x = (px - cx) / 40` (max ±8 px) with `quickTo(word, "x", { duration: 1.2, ease: "sleek" })`.
- `pointerleave` of the footer: both back to 0 with `sleekSpring` 1.2 s.
- The wordmark `g` needs a class (`logo-word`) added in `components/brand/logo.tsx` so it can be selected.

---

## 5. Required edits to existing code

1. **`components/motion/page-motion.tsx` → magnetic strength.** Where the magnetic code multiplies by `0.18`, read the attribute:
   `const k = Number(el.dataset.magnetic) || 0.18;` and use `k` for both axes.
2. **`page-motion.tsx` → marker ready flag.** In the reveal code, where the marker tween is created, add
   `onComplete: () => marks.forEach((m) => (m.dataset.ready = "1"))` to the marker `gsap.fromTo` options (F5).
3. **`page-motion.tsx` → marquee.** In the `if (full)` block that adjusts `playbackRate` from scroll velocity
   (`rate`, `rateTo`, `anims`, `tick`, `vel`, `settle`, `refreshCache`), **delete that block for `full`**, F13 replaces it.
   Keep the `bands.forEach` off-screen `is-offscreen` toggle only for the `lite` profile (phones keep CSS animation).
   Because `DesktopMotion` is gated at 1024 px but `full` is 768 px, keep the old block for widths 768 – 1023 by
   wrapping it in `window.matchMedia("(max-width: 1023px)").matches`.
4. **`project-visual.tsx`.** Hide the CSS "View" sticker on desktop: add `lg:hidden` to its classes (F1/F2).
5. **`globals.css`.** Add `.split-char { display: inline-block; }` and `.contact-glow` (F14).

## 6. Performance and accessibility checklist per effect

- All effects: gated by `DESKTOP_FINE`; cleanup verified; no layout properties animated.
- Pointer effects: one delegated listener per section; `quickTo` created once; rect cached; `will-change` only while active.
- Keyboard: F3 and F15 also run on `focus-visible`; F9 on `focus-within`; F16 works from the keyboard. Others are decorative.
- Screen readers: SplitText keeps `aria-label`; cursor, shine, glow, pulse rings, burst dots are `aria-hidden`.
- Reduced motion: the gate excludes it. (F16 still copies and swaps the label without animation.)
- Contrast: nothing here changes text colours; the orange cursor bubble text is white on `#D72B0C` (4.9:1).

## 7. Build order (one commit each, test before the next)

1. §2.1 eases in `lib/gsap.ts` + register `Draggable`/`ScrambleTextPlugin` + `lib/motion.ts` + `DesktopMotion` shell (renders nothing yet). Check: `npm run build`.
2. **F1** custom cursor (also tests the gate and the loader hand-off).
3. **F2** project tilt + shine + shadow follow, **F3** title wave, **F4** tech chips.
4. **F8 + F9 + F10** expertise magnetic chips, badge, counter.
5. **F11 + F12** timeline line + active card + scramble.
6. **F5 + F6 + F7** about: marker replay, heading skew, draggable cards.
7. **F13** marquee (with the §5.3 edit).
8. **F14 + F15 + F16** contact glow, email flip, copy button.
9. **F17 + F18** eyebrow counters, footer logo.
10. Update `README.md` and `V3-PROGRESS.md`; mark this file **IMPLEMENTED**.

## 8. Acceptance checklist (all must pass)

**Desktop (>= 1024 px, mouse):**
- [ ] Cursor dot follows with no jump on first move; grows on links; "View" over project visuals; "Drag" over fact cards; hidden during the loader and when the pointer leaves the window.
- [ ] Project visual tilts max 5°, shine follows the pointer, the shadow layer shifts opposite, everything returns smoothly on leave.
- [ ] Title letters wave once per hover with no layout shift and no duplicated screen-reader text.
- [ ] Expertise chips lean toward the pointer, neighbours move less, snap back with a small overshoot; counters count once.
- [ ] Timeline line is drawn exactly in step with scrolling (no lag, no overshoot, reverses when scrolling up); dots pulse once; the card near the viewport centre is fully opaque, others 50 %; period text scrambles once.
- [ ] Marker redraws on hover after its first reveal; sticky headings skew at most 2° while scrolling and return to 0 when scrolling stops; fact cards can be dragged and spring back.
- [ ] Marquee bands reverse when scrolling up, slow to 25 % on hover, resume smoothly, pause off-screen.
- [ ] Contact: glow follows inside the card, email letters flip, copy button copies and bursts, the live region announces "Email copied".
- [ ] Section numbers count up once; the footer logo turns and shifts with the pointer.
- [ ] Scrolling with Lenis while the pointer is still: hover states update to the element under the pointer.
- [ ] DevTools Performance with CPU 4x throttle: no long tasks from the effects, 60 fps while moving the pointer over each effect.

**Everywhere else:**
- [ ] Below 1024 px, on touch, or with reduced motion: the page behaves exactly as before (no custom cursor, no listeners added; verify in DevTools > Elements > Event Listeners).
- [ ] Resize across 1024 px both ways: effects start/stop cleanly, no duplicates, no stuck transforms.
- [ ] Navigate Home → `/work/[slug]` → back (and strict-mode remount in dev): no console errors, no leaked ScrollTriggers (`ScrollTrigger.getAll().length` returns to the same number after each round trip).
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run build` pass.
- [ ] Lighthouse performance score on the home page does not drop by more than 3 points versus before this change.

---

## 9. Implementation notes (deviations from the text above, and why)

Everything in §4 is built. These are the places where the code differs from the literal wording, each
because following the wording would have produced a bug or broken the "phones get exactly the current site" rule.

1. **F1 cursor structure.** The dot and the bubble are two separate fixed layers inside a plain (non-positioned)
   wrapper, not children of one `fixed z-[150]` root. `mix-blend-difference` only blends with the page when the
   element is not inside another stacking context, and a fixed + z-index root is one.
2. **Cleanups use `animationName`, not the `animation` shorthand (F13).** `ul.style.animation = "none"` also wipes the
   inline `animation-duration` / `animation-direction` the marquee markup relies on, and `= ""` on cleanup would
   hand the bands back at the 40 s default and forward direction. The code sets only `animationName`. Each band
   also starts at the phase the CSS animation had, and is seeded a few hundred loops in: a repeating tween
   cannot run backwards past time 0, so without the seed the reverse-on-scroll-up would simply stop.
3. **Marker "ready" flag (F5 / §5.2).** The reveal ends with `eventCallback("onComplete", ...)`, which replaces any
   `onComplete` passed in the tween vars. The flag is therefore set inside that callback, after `split.revert()`,
   on a fresh `.marker` lookup (the revert swaps the original nodes back in).
4. **Old marquee rate controller (§5.3)** stands down only while `DESKTOP_FINE` matches (live, via `matchMedia`
   `change`), instead of "width >= 1024". Touch laptops at 1024 px and wider keep the existing scroll-speed nudge.
5. **F2 / F9 / F18 CSS conflicts.** Tailwind's `transition-transform` / `transition-[transform,...]` on the tilt
   frame, the About fact cards and the expertise badge would CSS-transition GSAP's inline `transform` and make
   dragging and tilting lag. The frame and fact cards now transition `translate` / `rotate` only; the badge's CSS
   hover turn and the footer logo's CSS 90 degree turn are switched off *inside the desktop media query only*
   (unlayered rules at the end of `globals.css`), so tablets keep them.
6. **F11 timeline line** sits in a wrapper beside the `<ol>` instead of inside it (a `<span>` is not valid inside
   `<ol>`), and is `display: none` outside the desktop media query so phones never see a full-height orange line.
7. **F15 email underline** is a background line from 1024 px up (SplitText letters are inline-block and lose
   `text-decoration`); below that the original underline is untouched. Perspective is set from JS, not in markup.
8. **F1 "View" sticker** is hidden with the *same* media query as the cursor (`.view-sticker`), not `lg:hidden`,
   so a touch laptop at 1024 px and wider keeps its sticker.
9. **F3 / F15 splits use `words,chars`** so line breaking stays word based (adjacent inline-block letters could
   otherwise wrap mid-word).
10. **Follow smoothing (`quickTo`) is rebuilt per hover visit, never per move.** The return-to-rest tween takes
    over the same properties, and a fresh `quickTo` always starts from where the element is.
11. **CSS custom properties** for the shine and glow (`--mx` / `--my`) are written with `style.setProperty` (once
    per frame) instead of `gsap.set`.
