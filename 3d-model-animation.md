# 3d-model-animation.md — 3D layer: hero logo mark + project devices

Status: **3D-1 (hero logo mark) and 3D-2 (project devices) IMPLEMENTED.** Needs `npm install three @react-three/fiber` + `npm install -D @types/three` (3D-1 only), a build and a browser pass against section 8. This file is the single source of truth for the 3D work. MUST / MUST NOT = no
discretion. Numbers (sizes, durations, budgets, thresholds) are fixed; pixel offsets may be nudged by up to ±20 %
if it looks better, but not the structure. If a rule here cannot be met, **stop and report it**, do not quietly
break a budget.

Related specs: `hero-animation.md` + `hero-v2.md` (hero stage), `gsap-animation.md` (desktop micro-interactions,
the tilt in F2 is reused here), `animated.md` (loader). Hero text, the stage animation, the loader and phones are
not changed by this file.

---

## 0. Before writing code

1. `AGENTS.md`: this Next.js has breaking changes. Read the guides in `node_modules/next/dist/docs/` for
   `next/dynamic`, client components and `ssr: false` before using them.
2. `npm install`, make sure `npm run dev` works.
3. Read, in this order: `lib/gsap.ts` (plugins, `sleek` eases), `lib/motion.ts` (`DESKTOP_FINE`, helpers),
   `components/brand/logo-parts.ts` (the icon geometry used here), `components/loader/index.tsx` (the
   `delyte:reveal` event and `html[data-loader]`), `features/hero/index.tsx`, `features/hero/hero-fx.tsx`
   (`data-depth` parallax), `features/hero/hero-stage.tsx` (what the 3D mark must not fight),
   `features/work/project-visual.tsx`, `components/motion/micro/work-cards.ts` (F2 tilt).
4. Install the dependencies (the only new ones):
   ```
   npm install three @react-three/fiber
   npm install -D @types/three
   ```
   `@react-three/fiber` MUST be v9 or newer (React 19). **Do not install `@react-three/drei`**: it pulls in far
   more code than this needs. Everything required comes from `three` itself (`three/examples/jsm/...`).

## 1. Goals and hard rules

Two 3D moments, each with a clear job, and nothing else:

| # | Moment | Technique | Job |
|---|---|---|---|
| 3D-1 | Hero logo mark | Real WebGL (one small canvas) | A memorable first impression and brand identity, floating off the hero stage |
| 3D-2 | Project devices | CSS 3D only, **no WebGL** | Make each project card feel like a product in a device, with depth, at almost zero cost |

**Performance and mobile rules (MUST).**

1. **Phones and small tablets (< 1024 px) get exactly the current site.** No canvas, no `three` download, no
   poster, no extra markup that is visible. This is the most important rule in the file.
2. **At most ONE WebGL canvas on the whole site** (the hero mark). No other canvas, no second renderer.
3. **`three` and R3F MUST be code-split.** They load through `next/dynamic` (`ssr: false`) from a client wrapper,
   only after all of these are true: the desktop gate passes (§3), the capability check passes (§3), the loader
   has revealed the page, and the browser is idle. They MUST NOT appear in the initial JS of `/`.
4. **No lag.** The budgets in §2 are hard limits, and the runtime guard in §5.8 downgrades or removes the canvas
   if a device cannot keep up. A site that stutters is worse than a site without 3D.
5. **Every effect is optional.** With JS off, WebGL missing, low power, reduced motion or a lost GPU context,
   the page is complete and looks intentional (a static poster), with no layout shift.
6. **No layout shift.** The 3D slot has a reserved size in the server markup (§5.1).
7. **Accessibility.** The canvas is `aria-hidden`, has no focusable content, and `pointer-events: none`. Nothing
   important is communicated only by the 3D.
8. **One owner per property.** React Three Fiber (`useFrame`) owns the mesh transforms. GSAP owns only the CSS
   of the wrapper elements (entrance fade / scale, `data-depth` parallax) and plain numbers (an intro offset).
   GSAP MUST NOT touch a Three.js object directly, and `useFrame` MUST NOT touch the DOM.
9. **Brand.** Orange mark `#FF6A3D`, accent `#D72B0C` (see `LOGO_COLORS`). No new colours, no stock models, no
   downloaded model files for 3D-1.

## 2. Budgets (hard limits)

| Item | Limit | How to check |
|---|---|---|
| Lazy 3D chunk (three + R3F + scene), gzip | roughly 150 to 250 KB expected. **Above 300 KB: stop and report.** | `next build` output / Network tab |
| Added JS in the initial `/` bundle | 0 bytes of `three` / R3F; only the tiny wrapper (< 3 KB) | build output; Network tab on first load |
| Draw calls | 1 (all petals merged into one mesh) | `renderer.info.render.calls` in dev |
| Triangles | <= 12 000 | `renderer.info.render.triangles` in dev |
| Textures, shadows, post-processing, environment maps | none | code review |
| Geometry build (one time) | <= 30 ms on a mid laptop | `performance.now()` around the build in dev |
| Frame cost while visible | <= 4 ms CPU per frame on a mid laptop | Performance panel |
| Canvas pixel ratio | `dpr = [1, 1.5]` (never higher, even on 3x screens) | code review |
| CLS caused by 3D | 0 | Lighthouse / Performance panel |
| LCP | unchanged (the canvas MUST NOT be the LCP element) | Lighthouse |

## 3. Gate and tiers

Add `lib/webgl-tier.ts` (pure, no three import):

```ts
export type Tier3D = "poster" | "full";
export function get3DTier(): Tier3D   // call only in the browser, after mount
```

- **Canvas allowed ("full")** only when ALL are true:
  1. `window.matchMedia(DESKTOP_FINE).matches` (from `lib/motion.ts`: >= 1024 px, mouse, no reduced motion);
  2. WebGL2 is available (`canvas.getContext("webgl2")` non-null; release that probe context immediately);
  3. `navigator.deviceMemory` is undefined or >= 6, and `navigator.hardwareConcurrency` is undefined or >= 6
     (4 GB / 4 core machines get the poster);
  4. `navigator.connection?.saveData` is not true, and `effectiveType` is not `"slow-2g"`, `"2g"` or `"3g"`.
- **Otherwise "poster"**: a static, flat render of the icon (§5.2). Visible from `lg` (1024 px) up only.
- **Below 1024 px: nothing at all** (poster hidden with CSS, no canvas, no import).
- The gate is re-checked on `matchMedia` `change`: crossing the 1024 px line or toggling reduced motion mounts or
  unmounts the canvas and disposes everything (§5.9). No reload needed.

## 4. What changes in the repo

New files:

| File | Purpose |
|---|---|
| `lib/webgl-tier.ts` | `get3DTier()` (section 3) |
| `features/hero/hero-mark.tsx` | Client wrapper: reserved slot, static poster, gate, lazy import, crossfade |
| `features/hero/hero-mark-canvas.tsx` | The R3F scene (default export, only ever imported dynamically) |
| `features/hero/mark-geometry.ts` | Builds the merged extruded icon geometry from `ICON` (section 5.3) |

Changed files:

| File | Change |
|---|---|
| `features/hero/index.tsx` | Render `<HeroMark />` inside `[data-hero-visual]` (section 5.1) |
| `app/globals.css` | `.hero-mark*` styles (poster, slot, crossfade) |
| `features/work/project-visual.tsx` | Device chrome bar + `data-screen` wrapper (section 6) |
| `components/motion/micro/work-cards.ts` | Counter-parallax of the screenshot inside F2 (section 6.3) |
| `package.json` | the three dependencies from section 0 |
| `README.md`, `V3-PROGRESS.md` | document Phase 11 (section 9) |

Nothing else changes. `hero-stage.tsx`, `hero-fx.tsx`, the loader and `page-motion.tsx` are untouched.

---

## 5. 3D-1, the hero logo mark

### 5.1 Placement and slot (server markup)

Inside `[data-hero-visual]` in `features/hero/index.tsx`, as a sibling of the existing `data-depth="-1.6"` block:

```tsx
<div data-depth="2.2" className="hero-mark">
  <HeroMark />
</div>
```

- The slot is **top right of the stage, overlapping the browser frame's corner**, like the finished logo floating
  out of the window: `hero-mark` is `absolute -right-6 -top-10 z-10 hidden lg:block`, size
  `clamp(150px, 13vw, 220px)` square (`aspect-ratio: 1`). `pointer-events: none`, `aria-hidden`.
- `data-depth="2.2"` is the opposite sign of the stage's `-1.6`, so the two layers separate slightly with the
  pointer (handled by the existing `HeroFx`, nothing to write).
- The `SpinBadge` stays bottom left. Do not move it.
- Hidden below `lg`. At `lg` and up the slot always exists (poster or canvas), so there is no layout shift.

### 5.2 Static poster (always rendered at >= lg)

Server-rendered inline `<svg>` of the icon, built from `ICON` and `LOGO_BOX.icon` in `logo-parts.ts` (same
technique as `logo.tsx`), fill `#FF6A3D`, with a soft CSS drop shadow (`filter: drop-shadow(0 18px 24px rgb(215 43 12 / .25))`).
It is drawn at the size the 3D mark has at rest (about 64 % of the slot, `inset: 18%`), so the crossfade never makes
the logo jump. It is what no-JS, reduced-motion, touch laptops, low-power devices, WebGL failures and the
first moments before the canvas is ready see. It MUST look finished on its own.

### 5.3 Geometry (`mark-geometry.ts`)

Built once, at runtime, from the existing `ICON` paths (no model file):

1. For each `ICON` entry make `<path d="..." transform="..."/>` in one SVG string (viewBox from `LOGO_BOX.icon`).
2. Parse with `SVGLoader` (`three/examples/jsm/loaders/SVGLoader.js`); `SVGLoader.createShapes(path)` per path.
3. `ExtrudeGeometry(shapes, { depth: 26, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.5, bevelSegments: 2, curveSegments: 8 })`
   (units are logo units).
4. Flip Y (SVG y is down): `geometry.scale(1, -1, 1)`.
5. Centre on the icon box centre (`x 114.8 + 108.8`, `y 275.7 + 108.8`), then scale uniformly so the icon is
   **2 world units tall** (`2 / 217.6`).
6. Merge all 8 into ONE geometry with `mergeGeometries` (`three/examples/jsm/utils/BufferGeometryUtils.js`), then
   `computeVertexNormals()`. Result: 1 mesh, 1 draw call, <= 12 000 triangles. If over, lower `curveSegments`.
7. Dispose the temporary geometries after merging. The function returns the merged geometry; the caller owns it.

### 5.4 Material and lights

- ONE `MeshStandardMaterial`: `color #FF6A3D`, `roughness 0.38`, `metalness 0.12`. No clearcoat, no maps.
- `ambientLight` intensity 0.7.
- Key `directionalLight` intensity 2.4, colour `#FFFFFF`, position `(2.5, 3, 4)`.
- Rim `directionalLight` intensity 1.1, colour `#FF9A7A`, position `(-3, 1, -2)`.
- **No shadows, no environment map, no `Environment`, no post-processing.** Tone mapping left at the R3F default.

### 5.5 Camera and renderer

- `Canvas` props: `camera={{ fov: 35, position: [0, 0, 5], near: 0.1, far: 20 }}`, `dpr={[1, 1.5]}`,
  `gl={{ alpha: true, antialias: true, powerPreference: "low-power", stencil: false, depth: true }}`,
  `frameloop` controlled by state (`"always"` while visible, `"never"` otherwise, section 5.8).
- Transparent background (the hero background shows through). The canvas fills the slot (`h-full w-full`).
- No mesh has pointer handlers, so R3F never raycasts. The canvas has `pointer-events: none`.

### 5.6 Motion (all inside `useFrame`)

The icon has 4-fold symmetry, so turning it 90 degrees lands on an identical shape. Use that.

1. **Idle spin:** `rotation.z += delta * (Math.PI / 2) / 10` (a quarter turn every 10 s, so it always reads as
   continuous). Never a hard reset.
2. **Pointer tilt:** window-level passive `pointermove` listener (outside React, stored in a ref, normalised to
   -1..1 across the *viewport*). Target `rotation.x = ny * 0.32`, `rotation.y = nx * 0.42` (radians). Damped with
   `current += (target - current) * (1 - Math.exp(-delta * 4))` (frame-rate independent). The listener is removed
   on unmount. Ignore `pointerType === "touch"`.
3. **Scroll:** as the hero scrolls away, add `scrollProgress * 0.9` radians to `rotation.z` and scale the mesh
   from 1 to 0.86. `scrollProgress` = clamp(`window.scrollY / hero.offsetHeight`, 0, 1), written to a ref by
   one passive `scroll` listener (rAF-coalesced). No ScrollTrigger needed.
4. **Intro:** a plain object `{ o: -Math.PI / 2 }` tweened by GSAP to `0` over 1.4 s, ease `sleekSpring`; `useFrame`
   adds `o` to `rotation.z`. (GSAP animates a number, not the mesh: see rule 8.)
5. Hover has no effect. The mark is decoration.

### 5.7 Entrance and the poster crossfade (GSAP on the wrapper only)

Order: gate and capability pass, then `delyte:reveal` (or `html[data-loader] !== "play"`), then `requestIdleCallback`
(timeout 2000 ms, `setTimeout 300` fallback), then the dynamic import starts. 6 s failsafe on the reveal, like the
cursor. When the scene reports its first rendered frame (`onCreated` plus two frames):

- canvas wrapper: `fromTo({ autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: "sleek" })`
- poster: `to({ autoAlpha: 0, duration: 0.5, ease: "sleekOut" })`, then `display: none`
- start the intro tween (5.6.4) at the same moment.

Only `transform` and `opacity` are animated. If the user has crossed back out of the gate, kill these tweens.

### 5.8 Runtime guard (no lag, fixed numbers)

- **Visibility:** `IntersectionObserver` on the slot (`threshold: 0`) plus `document.visibilitychange`. Not
  visible or tab hidden: `frameloop="never"` (the GPU does nothing). Visible: `"always"`.
- **Frame-time guard:** inside `useFrame`, after 1 s of warm-up, average the frame delta over the next 60 frames.
  - Average > 24 ms (under about 41 fps): **step 1**, set `dpr` to `1` and stop the pointer tilt (spin only).
  - Still > 24 ms over the next 60 frames: **step 2**, unmount the canvas, show the poster permanently for this
    page view, and log once with `console.info`.
  The guard runs once per page view; it never re-upgrades.
- **Context loss:** `webglcontextlost` on the canvas: `preventDefault()`, unmount, show the poster. Do not try to restore.
- **Errors:** the dynamic import, the geometry build and the Canvas are wrapped so any thrown error leaves the
  poster in place and the rest of the page untouched (error boundary around the canvas).

### 5.9 Cleanup (MUST, nothing left behind)

On unmount, gate change, guard step 2 or context loss: remove every listener (pointer, scroll, visibility,
matchMedia), disconnect the `IntersectionObserver`, kill the GSAP tweens on the wrapper and the intro object,
`geometry.dispose()`, `material.dispose()`, `renderer.dispose()` and `renderer.forceContextLoss()` so the GPU context
is released, and restore the poster. React strict-mode double mounting MUST be safe (the geometry builder is pure;
cleanup is idempotent).

---

## 6. 3D-2, project devices (CSS 3D only, no WebGL)

**Why no WebGL here:** the project screenshots are remote images (Cloudinary), so using them as WebGL textures
needs CORS setup; four or more canvases would multiply GPU memory and render loops, which is the exact lag risk
this spec forbids; and the cards already tilt in 3D with CSS + GSAP (F2 in `gsap-animation.md`). So the device
look is built with CSS and the existing tilt.

### 6.1 Device chrome (static markup, >= lg only)

In `ProjectVisual`'s badge variant, inside the `[data-reveal='clip']` box:

- Add a browser bar: `hidden lg:flex`, height `1.75rem` (`h-7`), `absolute inset-x-0 top-0 z-10`, background
  `var(--ink)` at 92 % opacity, with three small dots (`size-1.5`, `bg-white/40`) on the left and a URL pill on the
  right of them showing the hostname of `project.live` (strip `https://` and trailing `/`), or `project.slug` if
  there is none. Text `t-meta`, `text-white/70`, truncated. `aria-hidden`.
- The screenshot wrapper (`[data-screen]`, the existing `absolute inset-0` div around `<Image>`) becomes
  `lg:top-7` so the screenshot sits **below** the bar. The card's aspect ratio is unchanged, so there is no layout
  shift. Below `lg` the bar is not rendered and the card is exactly as today.
- Add `data-screen=""` to that wrapper (used in 6.3).

### 6.2 Depth rules

- The hard shadow layer (`data-tilt-shadow`) and the highlight (`data-shine`) from F2 stay as they are.
- `transform-style: preserve-3d` MUST NOT be added to anything inside the clip box: `overflow: hidden` and
  `clip-path` flatten 3D children, so it would do nothing and only cost memory.
- Depth is created by the tilt (perspective 900, set by F2), the opposing shadow, and the counter-parallax below.

### 6.3 Counter-parallax (inside F2, desktop gate only)

In `work-cards.ts`, extend the existing tilt state with the `[data-screen]` element:

- On enter: `sx2 = gsap.quickTo(screen, "x", { duration: 0.7, ease: "sleek" })` and the same for `y`.
- On move: `screen x = nx * -6`, `screen y = ny * -6` (px; the screenshot moves against the tilt, like looking
  through a window).
- On leave: `gsap.to(screen, { x: 0, y: 0, duration: 1, ease: "sleekSpring", overwrite: "auto" })`.
- Cleanup: `clearProps: "transform"` on the screen element. Follow the same rules F2 already follows (no tilt while
  the clip reveal runs, `killTweensOf` before rebuilding quickTo, no layout reads in the move handler).
- Do not animate the `<img>` itself: `page-motion.tsx` already runs a scrubbed parallax on it.

---

## 7. Shared rules

1. **SSR / hydration.** The slot, poster and chrome bar are plain server markup. All gate logic runs after mount
   in `useEffect`. Never read `window` during render.
2. **Loader hand-off.** Nothing 3D starts, downloads or animates while the loader plays (`html[data-loader="play"]`).
3. **Lenis / ScrollTrigger.** The mark does not use ScrollTrigger. Its scroll listener is passive and rAF-coalesced.
   Never call `ScrollTrigger.refresh()` from the 3D code.
4. **Hero stage.** The mark does not listen to or dispatch hero events and does not overlap the stage's UI
   controls (the slot is `pointer-events: none` and sits in the stage's top-right margin).
5. **Reduced motion.** Poster only, no spin, no tilt, no import. Live changes are handled (section 3).
6. **No new global CSS animation.** All motion is `useFrame` or GSAP, as in section 1 rule 8.
7. **Dev-only stats.** Any `renderer.info` logging is behind `process.env.NODE_ENV !== "production"`.

## 8. Acceptance checklist (all must be true)

Behaviour
- [ ] Desktop (>= 1024 px, mouse, motion allowed, capable device): after the loader, the poster crossfades to a
      live 3D orange mark in the top right of the hero stage; it spins a quarter turn every 10 s and tilts toward
      the pointer; it settles from a -90 degree turn on entrance.
- [ ] Scrolling the hero away turns the mark slightly further and scales it to about 0.86.
- [ ] A project card tilts, the screenshot moves against the tilt by up to 6 px, and returns with a soft spring.
- [ ] >= lg project cards show the browser bar with the hostname; below lg they are exactly as before.

Gating and fallbacks
- [ ] 375 px, 768 px and 1023 px wide: no poster, no canvas, no `three` request, hero identical to before.
- [ ] Reduced motion on desktop: poster only, no canvas, no `three` request.
- [ ] Touch laptop / tablet >= 1024 px (no fine pointer): poster only.
- [ ] Low-end desktop (4 GB or 4 cores), data saver, or no WebGL2: poster only.
- [ ] Resizing across 1024 px mounts and unmounts the canvas live; no console errors, no leaked listeners.
- [ ] Forcing context loss (`WEBGL_lose_context`) leaves the poster and a working page.

Performance
- [ ] Network tab, first load of `/`: no `three` or R3F code until after reveal and idle; the lazy chunk is within
      the section 2 budget.
- [ ] Lighthouse mobile: performance score not lower than before this change; CLS 0; LCP element unchanged.
- [ ] `renderer.info`: 1 draw call, <= 12 000 triangles, 0 textures.
- [ ] Performance panel on desktop: no long tasks from the 3D after load; frame cost within budget; GPU idle when
      the hero is scrolled out of view or the tab is hidden.
- [ ] Throttled CPU (6x slowdown) triggers guard step 1 or 2 and the page stays smooth.

Hygiene
- [ ] No second canvas anywhere; no model files; no `drei`; no shadows, env maps or post-processing.
- [ ] Unmount disposes geometry, material and renderer and forces context loss; strict-mode double mount is safe.
- [ ] `npm run build` and `npm run lint` pass; no `any`; no hydration warnings.
- [ ] The canvas is `aria-hidden`, not focusable, `pointer-events: none`.

## 9. Docs to update when implemented

- `V3-PROGRESS.md`: tick Phase 11 and note "needs a browser test against the section 8 checklist".
- `README.md`: add a short "3D layer" section (what it is, the gate, the files, how to disable it: remove `<HeroMark />`).
- Replace the Status line at the top of this file with **IMPLEMENTED**, and add an "Implementation notes" section
  for any place the code deliberately differs from the text.

## 10. Tuning knobs

| What | Where | Default |
|---|---|---|
| Slot size / position | `.hero-mark` in `globals.css` | `clamp(150px, 13vw, 220px)`, `-right-6 -top-10` |
| Spin speed | `mark-geometry.ts` / scene constant `SPIN_PERIOD` | quarter turn per 10 s |
| Tilt strength | scene constants | x 0.32, y 0.42 rad |
| Damping | scene constant | 4 |
| Colour / finish | material in the scene | `#FF6A3D`, roughness 0.38, metalness 0.12 |
| Pixel ratio cap | `Canvas dpr` | `[1, 1.5]` |
| Guard threshold | scene constant `SLOW_MS` | 24 ms |
| Counter-parallax | `work-cards.ts` | 6 px |
| Device-bar height | `project-visual.tsx` | `h-7` |

## 11. Out of scope (do not add)

- The scroll-driven "story object", 3D skyline / globe, orbiting tech tokens and the 3D desk scene (heavier, more
  risk of lag, less value than the hero mark).
- Real 3D laptops / phones for projects, any glTF / `.glb` model, `drei`, post-processing, HDR environment files.
- Any 3D on phones or small tablets.

---

## 12. Implementation notes (3D-1, hero mark)

Built as specified, with these deliberate differences:

1. **Dependencies are not added to `package.json` / `package-lock.json`.** They could not be installed where this was
   written, and guessing version numbers would break `npm ci`. Run the commands in section 0; npm then updates both
   files. Until then the hero 3D files do not compile (the poster and the rest of the site are unaffected only once
   the packages are installed, because the files are part of the build).
2. **Y flip is done by the mesh, not the geometry.** The geometry stays in SVG orientation and the mesh has
   `scale.y = -1` (three flips the winding for negative scales). Baking the flip into the vertices would turn every
   face inside out. The mesh also keeps its scroll scale in `useFrame`.
3. **Geometry is centred and sized from its own bounding box** (2 world units tall) instead of hard-coded icon
   coordinates, and keeps `ExtrudeGeometry`'s own flat normals (recomputing them gives the same result). If the
   merged mesh is over 12 000 triangles it is rebuilt once with `curveSegments: 5`.
4. **Camera distance is 5, not 6.2**, and the poster is drawn at `inset: 18%`, so the 3D mark at rest and the poster
   are the same size and the crossfade does not jump.
5. **`forceContextLoss` is left to React Three Fiber.** R3F already disposes the renderer and releases the GPU context
   when the canvas unmounts; doing it again in a React effect would kill the context during strict-mode's
   mount / unmount / mount in development. The code only removes its own `webglcontextlost` listener first, so a
   normal unmount is never reported as a loss.
6. **Frame guard ignores resume spikes.** A frame delta above 0.2 s (resuming from a hidden tab or off-screen) is skipped
   and never counted toward the average.
7. **Files:** `lib/webgl-tier.ts`, `features/hero/hero-mark.tsx` (slot, poster, gate, lazy import, error boundary,
   crossfade), `features/hero/hero-mark-canvas.tsx` (scene), `features/hero/mark-geometry.ts`, `.hero-mark*` in
   `app/globals.css`, and one line in `features/hero/index.tsx`.

## 13. Implementation notes (3D-2, project devices)

Built as specified in section 6, no WebGL, no new dependencies.

1. `features/work/project-visual.tsx`: the browser bar (`hidden lg:flex`, `h-7`, three dots plus the hostname of
   `project.live`, or the slug) is rendered for cards only (`badge`). The screenshot wrapper gets `data-screen` and
   `lg:top-7`. Below 1024 px nothing is added or moved. Case-study heroes (no `badge`) are untouched.
2. `components/motion/micro/work-cards.ts`: the F2 tilt now also moves `[data-screen]` by up to 6 px against the tilt
   (`quickTo` built per hover visit, `sleekSpring` return, cleared with the rest of the card state). Placeholder cards
   without a screenshot simply skip it.
3. Not done on purpose: no `preserve-3d` anywhere inside the clip box (it would be flattened by `overflow: hidden`).
