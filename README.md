# Delyte Portfolio V3 — The Digital Atelier

Portfolio of Maduneche Samuel (Delyte), frontend developer in Lagos.

**Palette & type update:** white + signal orange (`#D72B0C`) with Montserrat for body text and Space Grotesk for headings; no intro loader.
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Lenis.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

Fonts (Montserrat body, Space Grotesk headings) load through `next/font/google`, so the first
`dev`/`build` needs internet access.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Homepage: hero, selected work, about, expertise, experience, contact |
| `/work/[slug]` | Case study for each project (statically generated) |
| `/sitemap.xml`, `/robots.txt` | SEO (mock projects excluded) |
| `/opengraph-image` | Generated social card |

## Editing content

- `lib/site.ts` — identity, email, WhatsApp, socials, navigation.
- `lib/data/projects.ts` — projects and case-study text. Entries with `mock: true`
  (Velora Beauty, ESTORA Properties, MedRay Labs) are placeholders: replace the fields, add an
  `image` URL (Cloudinary is allowed in `next.config.ts`) and set `mock: false`. Mock projects are
  `noindex` and left out of the sitemap until then. Set `year` only where it is verified.
- `lib/data/profile.ts` — skills, experience, education (taken from the CV).
- Before deploying, update `site.url` in `lib/site.ts` if the V3 domain differs.

## Design system

- Tokens live in `app/globals.css` (`--ivory` white, `--ink` near-black, `--electric` orange, …). Legacy names such as `--pink`/`--sun`
  now resolve to the same orange family. Add `.theme-dark` to any wrapper for a solid-orange section
  (accents flip to white).
- Type scale: `t-display`, `t-headline`, `t-title`, `t-body`, `t-meta`.
- `--muted-ink-text` and `--electric-text` are slightly deeper variants of the brand muted/electric
  colours, used for small text so it meets WCAG AA contrast. The brand tokens stay for fills and
  large type.
- UI primitives: `components/ui/` (`Section`, `Container`, `Eyebrow`, `CtaButton`, `ArrowLink`, `StatusDot`).

## Motion

- `lib/gsap.ts` registers ScrollTrigger, SplitText and CustomEase once, and defines the custom eases:
  `silk` (entrances), `glide` (in/out masks, scroll-to, page wipe) and `settle` (large surfaces).
- `components/lenis` runs Lenis from GSAP's ticker; programmatic scrolls use the `glide` ease.
- `components/motion/page-motion.tsx` drives all page animation. Headings (section `h2`, case-study `h1`)
  and paragraphs are detected automatically and revealed line by line with SplitText; the rest uses
  `data-*` hooks (`data-hero-*`, `data-eyebrow`, `data-reveal="fade|clip"`, `data-magnetic`).
  Hidden start states are applied at runtime only, so content stays visible without JS.
- Two profiles via `gsap.matchMedia`: desktop (>= 768px) gets masked heading lines, image parallax,
  magnetic buttons; phones get shorter distances, earlier triggers,
  sideways timeline/list slides and a tap-press effect, with no scrubbed parallax.
- To tune the feel, edit the `P` profile object near the top of `PageMotion`.
- `app/template.tsx` plays the page-transition wipe; there is no intro loader.
- `prefers-reduced-motion` disables animation, smooth scrolling, and transitions.

## Logo

Geometry lives in `components/brand/logo-parts.ts` (from `public/brand/delyte-logo.svg`). `components/brand/logo.tsx`
exports `Logo` (icon + wordmark; `variant="brand" | "reversed" | "mono"`) and `LogoIcon`. It is used in the navbar,
footer (reversed variant on black), the contact card watermark, the loader, `app/opengraph-image.tsx`, and the
generated `app/icon.svg`, `app/favicon.ico` and `app/apple-icon.png`. The icon turns 90 degrees on hover of any `.logo-link`.

## Loading screen

`components/loader` plays once per session on `/` (never for reduced motion). The icon petals bloom in,
then d-e-l-y-t-e rise letter by letter, a rule and counter appear, and a white curtain wipes up as the
hero headline starts. Timings live in the `T` object at the top of `components/loader/index.tsx`; the full
spec and acceptance checklist are in `animated.md`. The logo source is `public/brand/delyte-logo.svg`.

## Hero stage animation

`features/hero/hero-stage.tsx` is the hero's right side: a decorative mini browser window in which a cursor
draws one petal of the logo, mirrors and rotates it into the 8-petal icon, drags it into the nav bar, builds a
small page (card, heading, text, image, button), hovers the button and finally returns the logo to the centre.
The end state equals the start state, so the loop is seamless. Spec and acceptance checklist: `hero-animation.md`.

- All times live in `T` and all coordinates in `POS` at the top of the file; the stage CSS is in `app/globals.css`
  (`.hs*`). Desktop runs an 11 s loop, phones an 8 s version. Reduced motion and no-JS show the finished frame.
- `lib/gsap.ts` also registers `MotionPathPlugin` and `DrawSVGPlugin` (both ship with `gsap` >= 3.13).
- The loop starts on the loader's `delyte:reveal` event (6 s failsafe) and pauses off-screen and in hidden tabs.

## Desktop micro-interactions

A second, optional motion layer runs **only** on desktop with a mouse and no reduced-motion preference
(`(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`,
exported as `DESKTOP_FINE` in `lib/motion.ts`). Everywhere else the site is exactly as before: no listeners,
no extra tweens.

It adds a context cursor ("View" / "Drag"), project-card tilt + shine, a title letter wave, chip pop-in,
magnetic skill chips, "N tools" counters, a scroll-drawn timeline with an active job card and period scramble,
a replaying highlighter, draggable fact cards, reversing marquee bands, a contact glow, an email letter flip,
a copy-email button with a dot burst, section-number count-ups and a pointer-aware footer logo.

- `components/motion/desktop-motion.tsx`: one `gsap.matchMedia()` that runs every module and their cleanups.
- `components/motion/micro/*.ts`: one file per group (`work-cards`, `about`, `expertise`, `experience`, `marquee`,
  `contact`, `eyebrows`, `footer`). Each exports `initX(): () => void`.
- `components/cursor/index.tsx`: the custom cursor (mounted in `app/layout.tsx`).
- `features/contact/copy-email.tsx`: the copy button. It works on every device; only its roll and burst are desktop-gated.
- `lib/motion.ts`: `DESKTOP_FINE`, small helpers and `trackHover` (one delegated listener per section that also
  re-samples while Lenis scrolls under a still pointer).
- New eases `sleek`, `sleekOut`, `sleekSpring` live in `lib/gsap.ts`.

Spec and acceptance checklist: `gsap-animation.md`.

## 3D layer

`3d-model-animation.md` has the plan, budgets, gating and acceptance checklist.

- **Hero logo mark (done):** a static poster of the icon from 1024 px up; on capable desktops (mouse, motion allowed,
  WebGL2, enough memory and cores) it is replaced by a live 3D mark. One lazy canvas, one mesh, no model file: it is
  extruded from the logo paths in `components/brand/logo-parts.ts`. Files: `features/hero/hero-mark.tsx` (slot and
  gate), `hero-mark-canvas.tsx` (scene), `mark-geometry.ts`, `lib/webgl-tier.ts`. Phones and small tablets render
  nothing and never download `three`. To switch it off, remove `<HeroMark />` from `features/hero/index.tsx`.
- **Needs these packages before it builds:** `npm install three @react-three/fiber` and `npm install -D @types/three`.
- **CSS-3D project devices (done, no WebGL):** from 1024 px up each project card has a small browser bar (dots + hostname) and the screenshot moves a few pixels against the card tilt on desktop hover. Phones and tablets are unchanged.

## Optional cleanup

`@studio-freight/lenis` (duplicate of `lenis`) and `react-icons` are no longer imported.
Remove with `npm uninstall @studio-freight/lenis react-icons` (this updates the lockfile).
