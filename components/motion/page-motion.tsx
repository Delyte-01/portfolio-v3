"use client";

import { EASE, gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { DESKTOP_FINE } from "@/lib/motion";

/**
 * Central animation controller.
 *
 * Principles
 *  - Subtle: small distances, long soft tails, gentle staggers.
 *  - Custom easing: "silk" / "glide" / "settle" (see lib/gsap.ts), never the
 *    stock power/expo curves.
 *  - Transform + opacity + clip-path only (GPU friendly), once-only triggers.
 *  - Two motion profiles via gsap.matchMedia:
 *      desktop (>= 768px)  line-masked headings, per-line paragraphs,
 *                          image parallax, magnetic buttons.
 *      mobile  (<  768px)  lighter distances, earlier triggers, slide-in
 *                          timeline/list items, tap-press feedback, no
 *                          scrubbed parallax (saves battery, avoids jank).
 *  - prefers-reduced-motion: nothing runs; content is simply visible.
 *
 * Hooks (all optional, content stays visible without JS):
 *   data-hero-*            hero entrance (label, word, copy, cta, meta) and the scroll parallax on
 *                          data-hero-visual. The stage inside it (features/hero/hero-stage.tsx)
 *                          runs its own window intro + loop; the wrapper is never animated twice.
 *   data-contact-*         contact card entrance, light sweep, pointer tilt
 *   data-eyebrow           small section labels
 *   data-reveal="fade"     fade + rise
 *   data-reveal="clip"     clip-path image reveal (+ parallax on desktop)
 *   data-magnetic          magnetic hover / tap press. The value overrides the pull strength
 *                          (data-magnetic="0.08"); empty keeps the default 0.18.
 *   Headings (section h2, case-study h1) and paragraphs are detected
 *   automatically and revealed line by line with SplitText.
 *   Everything inside #case-intro (case-study heading, summary, eyebrow, facts) plays straight away
 *   on load instead of waiting for a scroll: a trigger whose start is clamped to the very top of the
 *   page never "enters" until the first scroll, so those elements skip ScrollTrigger entirely.
 */

const HEADINGS = "main [data-section] h2:not(.t-meta), #case-intro h1";
const TEXTS = "main p.t-body, main p[data-reveal='fade'], main blockquote";
/** Containers that already fade in as a block; text inside them is not split again. */
const FADED_PARENT = "[data-reveal='fade'], [data-project] > div";
const FADE = "[data-reveal='fade'], [data-project] > div, footer > div";
/** Items that slide in from the side on phones (timeline + list rows). */
const SLIDE = "#experience ol > li, #archive li";

/** Above-the-fold block on case-study pages. Plays on load, not on scroll. */
const INTRO = "#case-intro";
/** The page wipe (app/template.tsx) covers the new page for about a second; start under its tail. */
const INTRO_DELAY = 0.32;

const unique = <T,>(list: T[]) => Array.from(new Set(list));

export function PageMotion({ hero: withHero = true }: { hero?: boolean }) {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        full: "(prefers-reduced-motion: no-preference) and (min-width: 768px)",
        lite: "(prefers-reduced-motion: no-preference) and (max-width: 767px)",
      },
      (ctx: gsap.Context) => {
        const { full } = ctx.conditions as { full: boolean; lite: boolean };
        const finePointer = full && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
        const cleanups: Array<() => void> = [];

        // One profile object holds every number that differs between phone and desktop.
        const P = full
          ? {
              dur: 1,
              start: "clamp(top 87%)",
              fadeY: 28,
              fadeStagger: 0.08,
              headLines: { dur: 1.25, stagger: 0.09, from: 105 },
              textLines: { dur: 1.05, stagger: 0.055, y: 18 },
            }
          : {
              dur: 0.75,
              start: "clamp(top 93%)",
              fadeY: 16,
              fadeStagger: 0.06,
              headLines: { dur: 0.95, stagger: 0.07, from: 100 },
              textLines: { dur: 0.8, stagger: 0.04, y: 12 },
            };

        // ── Hero entrance (plays straight away, no loader) ───────────────
        if (withHero) {
          // While the loading screen plays, build the hero paused (its hidden start state is
          // already applied behind the overlay) and start it when the loader says "reveal".
          const loaderPending = document.documentElement.dataset.loader === "play";
          const hero = gsap.timeline({ paused: loaderPending, defaults: { ease: EASE.silk } });
          if (loaderPending) {
            const go = () => hero.play();
            window.addEventListener("delyte:reveal", go, { once: true });
            const failsafe = window.setTimeout(go, 6000);
            cleanups.push(() => {
              window.removeEventListener("delyte:reveal", go);
              window.clearTimeout(failsafe);
            });
          }
          hero
            .from("[data-hero-label]", { autoAlpha: 0, y: 10, duration: P.dur * 0.8 })
            .from(
              "[data-hero-word]",
              { yPercent: 108, duration: P.dur * 1.3, stagger: full ? 0.075 : 0.055 },
              "<0.05",
            )
            .from("[data-hero-copy]", { autoAlpha: 0, y: 16, duration: P.dur }, "-=0.8")
            .from("[data-hero-cta] > *", { autoAlpha: 0, y: 12, duration: P.dur * 0.85, stagger: 0.08 }, "-=0.75")
            .from("[data-hero-meta] > div", { autoAlpha: 0, y: 8, duration: P.dur * 0.8, stagger: 0.06 }, "-=0.6");

          if (full) {
            // Gentle hero parallax on scroll (desktop only).
            gsap.to("[data-hero-visual]", {
              yPercent: -6,
              ease: "none",
              scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: 0.8 },
            });
          }
        }

        // ── Scroll progress bar (scaleX only, scrubbed) ──────────────────
        gsap.fromTo(
          "[data-progress]",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 },
          },
        );

        // ── Headings & paragraphs: line-by-line reveal with SplitText ────
        // Text is hidden up front, then split at the moment it scrolls into
        // view (so line breaks are measured at the current width and never go
        // stale on resize). When the animation ends the split is reverted, so
        // the DOM goes back to its clean original markup.
        const headingEls = unique(gsap.utils.toArray<HTMLElement>(HEADINGS));
        const textEls = unique(gsap.utils.toArray<HTMLElement>(TEXTS)).filter(
          (el) =>
            !el.hasAttribute("data-hero-copy") &&
            !el.matches(HEADINGS) &&
            !el.parentElement?.closest(FADED_PARENT),
        );

        let disposed = false;
        cleanups.push(() => {
          disposed = true;
        });

        const revealText = (el: HTMLElement, kind: "heading" | "text") => {
          gsap.set(el, { autoAlpha: 0 });
          const immediate = Boolean(el.closest(INTRO));
          const play = () => {
            if (disposed) return;
              const split = SplitText.create(el, { type: "lines", linesClass: "split-line" });
              const lines = split.lines as HTMLElement[];

              let tween: gsap.core.Tween;
              if (kind === "heading") {
                // Wrap each line in a clipping mask. The bottom padding/negative
                // margin pair keeps descenders (g, y, p) from being cut off.
                lines.forEach((line) => {
                  const mask = document.createElement("span");
                  mask.style.cssText = "display:block;overflow:hidden;padding-bottom:.16em;margin-bottom:-.16em";
                  line.parentNode?.insertBefore(mask, line);
                  mask.appendChild(line);
                });
                tween = gsap.from(lines, {
                  yPercent: P.headLines.from,
                  duration: P.headLines.dur,
                  stagger: P.headLines.stagger,
                  ease: EASE.silk,
                });
              } else {
                tween = gsap.from(lines, {
                  autoAlpha: 0,
                  y: P.textLines.y,
                  duration: P.textLines.dur,
                  stagger: P.textLines.stagger,
                  ease: EASE.silk,
                });
              }
              gsap.set(el, { autoAlpha: 1 });

              // Highlighter marker draws itself in after the words land.
              const marks = el.querySelectorAll<HTMLElement>(".marker");
              const markTween = marks.length
                ? gsap.fromTo(
                    marks,
                    { backgroundSize: "0% 100%", backgroundRepeat: "no-repeat" },
                    {
                      backgroundSize: "100% 100%",
                      duration: 1.1,
                      delay: 0.45,
                      ease: EASE.glide,
                      clearProps: "backgroundSize,backgroundRepeat",
                    },
                  )
                : null;

              // Revert the split once everything (including the marker) has finished. The revert puts
              // the original nodes back, so the "ready" flag (hover replay, desktop-animation layer
              // F5) is set on a fresh lookup afterwards.
              (markTween ?? tween).eventCallback("onComplete", () => {
                split.revert();
                el.querySelectorAll<HTMLElement>(".marker").forEach((m) => (m.dataset.ready = "1"));
              });
              cleanups.push(() => {
                tween.kill();
                markTween?.kill();
                split.revert();
              });
          };

          if (immediate) {
            // Wait for fonts so the line breaks are measured on the final glyphs, then play.
            const delay = INTRO_DELAY + (kind === "heading" ? 0 : 0.25);
            const start = () => {
              if (!disposed) gsap.delayedCall(delay, play);
            };
            if (document.fonts?.ready) document.fonts.ready.then(start).catch(start);
            else start();
            return;
          }

          ScrollTrigger.create({ trigger: el, start: P.start, once: true, onEnter: play });
        };

        headingEls.forEach((el) => revealText(el, "heading"));
        textEls.forEach((el) => revealText(el, "text"));

        // ── Eyebrows: label slides in, the rule line draws ───────────────
        gsap.utils.toArray<HTMLElement>("[data-eyebrow]").forEach((el: HTMLElement) => {
          const kids = Array.from(el.children);
          const rule = el.querySelector<HTMLElement>(":scope > span[aria-hidden]");
          const tl = gsap.timeline(
            el.closest(INTRO)
              ? { delay: INTRO_DELAY - 0.08 }
              : { scrollTrigger: { trigger: el, start: P.start, once: true } },
          );
          tl.from(kids, { autoAlpha: 0, x: full ? -10 : -6, duration: P.dur * 0.9, stagger: 0.08, ease: EASE.silk });
          if (rule) {
            tl.from(rule, { scaleX: 0, transformOrigin: "0% 50%", duration: P.dur * 1.1, ease: EASE.glide }, 0.05);
          }
        });

        // ── Blocks: fade + rise (phones slide list/timeline items sideways) ─
        const isTextual = (el: HTMLElement) => el.matches(TEXTS) || el.matches(HEADINGS) || el.hasAttribute("data-eyebrow");
        const fadeAll = unique(gsap.utils.toArray<HTMLElement>(FADE)).filter((el) => !isTextual(el));
        const slideEls = fadeAll.filter((el) => el.matches(SLIDE));
        const riseEls = fadeAll.filter((el) => !el.matches(SLIDE));

        const batchIn = (
          els: HTMLElement[],
          from: { x?: number; y?: number; scale?: number },
          opts: { dur: number; stagger: number },
        ) => {
          if (!els.length) return;
          // `transition: none` stops CSS hover transitions from fighting the tween;
          // everything is cleared again once the element has landed.
          gsap.set(els, { autoAlpha: 0, x: from.x ?? 0, y: from.y ?? 0, scale: from.scale ?? 1, transition: "none" });
          ScrollTrigger.batch(els, {
            start: P.start,
            once: true,
            onEnter: (batch: Element[]) =>
              gsap.to(batch, {
                autoAlpha: 1,
                x: 0,
                y: 0,
                scale: 1,
                duration: opts.dur,
                ease: EASE.silk,
                stagger: opts.stagger,
                overwrite: true,
                onComplete: () => {
                  gsap.set(batch, { clearProps: "transform,opacity,visibility,transition" });
                },
              }),
          });
        };

        // Case-study intro blocks (facts row) play on load, after the heading and summary.
        const introEls = riseEls.filter((el) => el.closest(INTRO));
        const scrollEls = riseEls.filter((el) => !el.closest(INTRO));
        if (introEls.length) {
          gsap.fromTo(
            introEls,
            { autoAlpha: 0, y: P.fadeY },
            {
              autoAlpha: 1,
              y: 0,
              duration: P.dur * 1.05,
              ease: EASE.silk,
              stagger: P.fadeStagger,
              delay: INTRO_DELAY + 0.55,
              clearProps: "transform,opacity,visibility",
            },
          );
        }

        batchIn(scrollEls, { y: P.fadeY }, { dur: P.dur * 1.05, stagger: P.fadeStagger });
        batchIn(slideEls, full ? { y: 20 } : { x: -14 }, { dur: P.dur, stagger: P.fadeStagger });

        // About fact cards pop in with a hint of scale; contact links glide in.
        batchIn(
          gsap.utils.toArray<HTMLElement>("#about dl > div"),
          { y: full ? 28 : 18, scale: 0.96 },
          { dur: P.dur * 1.05, stagger: full ? 0.09 : 0.07 },
        );

        // ── Contact card: rises in, depth layers settle, then content cascades ──
        const contact = document.querySelector<HTMLElement>("[data-contact-card]");
        if (contact) {
          const surface = contact.querySelector<HTMLElement>("[data-contact-surface]");
          const ghost = contact.querySelector<HTMLElement>("[data-contact-ghost]");
          const halo = contact.querySelector<HTMLElement>("[data-contact-halo]");
          const mark = contact.querySelector<HTMLElement>("[data-contact-mark]");
          const sheen = contact.querySelector<HTMLElement>("[data-contact-sheen]");
          const items = gsap.utils.toArray<HTMLElement>("[data-contact-item]", contact);

          const tl = gsap.timeline({
            defaults: { ease: EASE.silk },
            scrollTrigger: { trigger: contact, start: P.start, once: true },
          });
          tl.from(surface, { autoAlpha: 0, y: full ? 48 : 26, scale: full ? 0.96 : 1, duration: P.dur * 1.3, ease: EASE.settle })
            .from(halo, { autoAlpha: 0, duration: P.dur * 1.6, ease: EASE.glide }, 0.25)
            .from(
              ghost,
              { autoAlpha: 0, x: full ? -14 : 0, y: full ? -14 : -12, duration: P.dur * 1.2, ease: EASE.glide },
              0.2,
            )
            .from(mark, { autoAlpha: 0, scale: 0.8, duration: P.dur * 1.8, ease: EASE.settle }, 0.3)
            .from(
              items,
              { autoAlpha: 0, y: full ? 16 : 12, duration: P.dur * 0.95, stagger: full ? 0.08 : 0.06, clearProps: "transform,opacity,visibility" },
              0.45,
            );

          if (full) {
            // A soft light sweep crosses the card every few seconds (paused off-screen).
            if (sheen) {
              gsap.set(sheen, { skewX: -18, xPercent: -120, autoAlpha: 1 });
              const sweep = gsap.to(sheen, {
                xPercent: 330,
                duration: 1.9,
                ease: EASE.glide,
                repeat: -1,
                repeatDelay: 4.5,
                delay: 2.2,
                paused: true,
              });
              ScrollTrigger.create({
                trigger: contact,
                start: "top bottom",
                end: "bottom top",
                onToggle: (self: ScrollTrigger) => sweep.paused(!self.isActive),
              });
              cleanups.push(() => sweep.kill());
            }

            // Gentle 3D tilt toward the pointer (mouse only).
            if (finePointer && surface) {
              gsap.set(surface, { transformPerspective: 1000 });
              const rx = gsap.quickTo(surface, "rotationX", { duration: 0.9, ease: EASE.silk });
              const ry = gsap.quickTo(surface, "rotationY", { duration: 0.9, ease: EASE.silk });
              const move = (e: PointerEvent) => {
                const r = contact.getBoundingClientRect();
                ry(((e.clientX - r.left) / r.width - 0.5) * 5);
                rx(-((e.clientY - r.top) / r.height - 0.5) * 5);
              };
              const leave = () => {
                rx(0);
                ry(0);
              };
              contact.addEventListener("pointermove", move, { passive: true });
              contact.addEventListener("pointerleave", leave);
              cleanups.push(() => {
                contact.removeEventListener("pointermove", move);
                contact.removeEventListener("pointerleave", leave);
              });
            }
          }
        }

        // Timeline dots settle into place as their card arrives.
        gsap.utils.toArray<HTMLElement>("#experience ol > li").forEach((li: HTMLElement) => {
          const dot = li.querySelector<HTMLElement>(":scope > span[aria-hidden]");
          if (!dot) return;
          gsap.from(dot, {
            scale: 0.3,
            autoAlpha: 0,
            duration: P.dur * 1.1,
            ease: EASE.settle,
            scrollTrigger: { trigger: li, start: full ? "top 82%" : "top 90%", once: true },
          });
        });

        // ── Images: soft clip-path reveal (+ gentle parallax on desktop) ──
        gsap.utils.toArray<HTMLElement>("[data-reveal='clip']").forEach((el: HTMLElement) => {
          const img = el.querySelector<HTMLElement>("img");
          const st = { trigger: el, start: full ? "top 86%" : "top 92%", once: true };

          if (full) {
            gsap.from(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.4, ease: EASE.glide, scrollTrigger: st });
            if (img) {
              // Rest at 1.12 so the parallax has spare pixels to move through.
              gsap.fromTo(img, { scale: 1.26 }, { scale: 1.12, duration: 2, ease: EASE.settle, scrollTrigger: st });
              gsap.fromTo(
                img,
                { yPercent: -5 },
                {
                  yPercent: 5,
                  ease: "none",
                  scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 },
                },
              );
            }
          } else {
            // Phones: a quieter fade-and-unveil, no scrubbed parallax.
            gsap.from(el, {
              clipPath: "inset(14% 0% 0% 0%)",
              autoAlpha: 0,
              duration: 1,
              ease: EASE.silk,
              scrollTrigger: st,
              onComplete: () => {
                gsap.set(el, { clearProps: "clipPath" });
              },
            });
            if (img) {
              gsap.from(img, { scale: 1.1, duration: 1.4, ease: EASE.settle, scrollTrigger: st });
            }
          }
        });

        // ── Marquees: pause off-screen, ease up slightly with scroll speed ─
        const bands = gsap.utils.toArray<HTMLElement>(".marquee");
        if (bands.length) {
          bands.forEach((band) => {
            ScrollTrigger.create({
              trigger: band,
              start: "top bottom",
              end: "bottom top",
              onToggle: (self: ScrollTrigger) => band.classList.toggle("is-offscreen", !self.isActive),
            });
          });

          if (full) {
            // Scroll-speed nudge for the bands, via WAAPI playbackRate on the CSS animation. On
            // desktop with a mouse the GSAP layer (components/motion/micro/marquee.ts) takes the
            // bands over and reverses them with the scroll direction, so this stands down there and
            // runs everywhere else (tablets, touch laptops). It follows the same media query live.
            const desktopLayer = window.matchMedia(DESKTOP_FINE);

            const installRate = (): (() => void) => {
              const rate = { v: 1 };
              let applied = 1;
              const rateTo = gsap.quickTo(rate, "v", { duration: 1, ease: EASE.silk });

              // Cache the CSS animations once; WAAPI playbackRate is very cheap.
              const anims = () => bands.flatMap((b) => b.getAnimations({ subtree: true }));
              let cached = anims();

              const tick = () => {
                if (Math.abs(rate.v - applied) < 0.02) return;
                applied = rate.v;
                cached.forEach((a) => (a.playbackRate = applied));
              };
              gsap.ticker.add(tick);

              const vel = ScrollTrigger.create({
                start: 0,
                end: "max",
                onUpdate: (self: ScrollTrigger) => {
                  // Capped at +1.6x so the bands lean into the scroll without racing.
                  const v = Math.min(Math.abs(self.getVelocity()) / 900, 1.6);
                  rateTo(1 + v);
                },
              });
              const settle = () => rateTo(1);
              ScrollTrigger.addEventListener("scrollEnd", settle);
              const refreshCache = () => (cached = anims());
              window.addEventListener("load", refreshCache);

              return () => {
                gsap.killTweensOf(rate);
                gsap.ticker.remove(tick);
                vel.kill();
                ScrollTrigger.removeEventListener("scrollEnd", settle);
                window.removeEventListener("load", refreshCache);
                cached.forEach((a) => (a.playbackRate = 1));
              };
            };

            let disposeRate: (() => void) | null = desktopLayer.matches ? null : installRate();
            const onLayerChange = () => {
              disposeRate?.();
              disposeRate = null;
              // Let the desktop layer finish handing the CSS animations back (or taking them over)
              // before measuring them.
              requestAnimationFrame(() => {
                if (!disposed && !desktopLayer.matches) disposeRate = installRate();
              });
            };
            desktopLayer.addEventListener("change", onLayerChange);

            cleanups.push(() => {
              desktopLayer.removeEventListener("change", onLayerChange);
              disposeRate?.();
              disposeRate = null;
            });
          }
        }

        // ── Buttons: magnetic on mouse, soft press on touch ──────────────
        const buttons = gsap.utils.toArray<HTMLElement>("[data-magnetic]");
        if (finePointer) {
          buttons.forEach((el) => {
            const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: EASE.silk });
            const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: EASE.silk });
            // data-magnetic="0.08" overrides the default pull of 0.18 (empty value keeps the default).
            const k = Number(el.dataset.magnetic) || 0.18;
            const move = (e: PointerEvent) => {
              const r = el.getBoundingClientRect();
              xTo((e.clientX - (r.left + r.width / 2)) * k);
              yTo((e.clientY - (r.top + r.height / 2)) * k);
            };
            const leave = () => {
              xTo(0);
              yTo(0);
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerleave", leave);
            cleanups.push(() => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerleave", leave);
            });
          });
        } else if (!full) {
          // Phones have no hover, so give taps a tiny, springy acknowledgement.
          buttons.forEach((el) => {
            const down = () => gsap.to(el, { scale: 0.97, duration: 0.25, ease: EASE.silk, overwrite: "auto" });
            const up = () => gsap.to(el, { scale: 1, duration: 0.6, ease: EASE.settle, overwrite: "auto" });
            el.addEventListener("pointerdown", down, { passive: true });
            el.addEventListener("pointerup", up);
            el.addEventListener("pointercancel", up);
            el.addEventListener("pointerleave", up);
            cleanups.push(() => {
              el.removeEventListener("pointerdown", down);
              el.removeEventListener("pointerup", up);
              el.removeEventListener("pointercancel", up);
              el.removeEventListener("pointerleave", up);
            });
          });
        }

        // Fonts and images change layout height after loading; keep triggers accurate.
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh);
        document.fonts?.ready.then(refresh).catch(() => {});
        cleanups.push(() => window.removeEventListener("load", refresh));

        return () => cleanups.forEach((fn) => fn());
      },
    );

    // Revert every tween, ScrollTrigger and listener on unmount.
    return () => mm.revert();
  }, [withHero]);

  // Thin orange progress bar. Scaled by GSAP; stays flat (zero width) without JS.
  return (
    <div
      aria-hidden
      data-progress
      className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-[3px] origin-left scale-x-0 bg-electric"
    />
  );
}
