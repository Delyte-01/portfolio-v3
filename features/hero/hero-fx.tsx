"use client";

/**
 * Left-side hero effects. Renders nothing; it finds its targets by data attribute inside #home.
 * Desktop (>= 1024px) and no-reduced-motion only. Everything it does not run leaves the static markup
 * exactly as server-rendered (word reads "engineered.", scribble drawn, spotlight hidden).
 *
 *  [data-rot]            rotating word (data-words="a|b|c")
 *  [data-hero-scribble]  hand-drawn underline, redrawn on every "step 0" signal from the stage
 *  [data-depth]          pointer depth layers (value = strength and direction)
 *  [data-hero-spot]      grid spotlight following the pointer
 *  [data-hero-line-item] headline words; rows slide apart on scroll
 */

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { HERO_STEP_EVENT, type HeroSignal } from "./hero-events";

const HOLD = 2.8; // seconds each word stays

export function HeroFx() {
  useGSAP(() => {
    const root = document.getElementById("home");
    if (!root) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
      const cleanups: Array<() => void> = [];
      let inView = true;
      const listeners: Array<() => void> = [];
      const sync = () => listeners.forEach((fn) => fn());

      /** Run `cb` once the loader hands over (or straight away when there is no loader). */
      const onReveal = (cb: () => void) => {
        if (document.documentElement.dataset.loader !== "play") {
          cb();
          return;
        }
        let done = false;
        const go = () => {
          if (done) return;
          done = true;
          cb();
        };
        window.addEventListener("delyte:reveal", go, { once: true });
        const failsafe = window.setTimeout(go, 6000);
        cleanups.push(() => {
          window.removeEventListener("delyte:reveal", go);
          window.clearTimeout(failsafe);
        });
      };

      /* ── Visibility: pause the word rotation off-screen / in a hidden tab ── */
      const st = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self: ScrollTrigger) => {
          inView = self.isActive;
          sync();
        },
      });
      const onVisibility = () => sync();
      document.addEventListener("visibilitychange", onVisibility);
      cleanups.push(() => {
        st.kill();
        document.removeEventListener("visibilitychange", onVisibility);
      });

      /* ── Rotating word ─────────────────────────────────────────── */
      const rot = root.querySelector<HTMLElement>("[data-rot]");
      if (rot) {
        const words = (rot.dataset.words ?? "").split("|").filter(Boolean);
        if (words.length > 1) {
          let i = 0;
          const next = () => {
            i = (i + 1) % words.length;
            gsap
              .timeline()
              .to(rot, { yPercent: -110, duration: 0.45, ease: "power3.in" })
              .call(() => {
                rot.textContent = words[i];
              })
              .fromTo(rot, { yPercent: 110 }, { yPercent: 0, duration: 0.75, ease: "silk" });
          };
          const tick = gsap.timeline({ paused: true, repeat: -1 });
          tick.to({}, { duration: HOLD }).call(next);
          let armed = false;
          onReveal(() => {
            gsap.delayedCall(3.4, () => {
              armed = true;
              sync();
            });
          });
          listeners.push(() => {
            if (armed) tick.paused(!inView || document.hidden);
          });
          cleanups.push(() => {
            tick.kill();
            gsap.set(rot, { clearProps: "transform" });
            rot.textContent = words[0];
          });
        }
      }

      /* ── Scribble: redrawn every cycle (listens to the stage) ───── */
      const scribble = root.querySelector<SVGPathElement>("[data-hero-scribble] path");
      if (scribble) {
        gsap.set(scribble, { drawSVG: "0% 0%" });
        let drawn = false;
        let tl: gsap.core.Timeline | null = null;
        const draw = () => {
          drawn = true;
          tl?.kill();
          tl = gsap
            .timeline()
            .to(scribble, { drawSVG: "100% 100%", duration: 0.35, ease: "power2.in" })
            .fromTo(scribble, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.95, ease: "silk" }, ">0.1");
        };
        const onSignal = (e: Event) => {
          const d = (e as CustomEvent<HeroSignal>).detail;
          if (d && d.type === "step" && d.step === 0) draw();
        };
        window.addEventListener(HERO_STEP_EVENT, onSignal);
        // If the stage never signals (script error, slow load), still show the underline once.
        const failsafe = window.setTimeout(() => {
          if (!drawn) gsap.fromTo(scribble, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.95, ease: "silk" });
        }, 9000);
        cleanups.push(() => {
          window.removeEventListener(HERO_STEP_EVENT, onSignal);
          window.clearTimeout(failsafe);
          tl?.kill();
          gsap.set(scribble, { clearProps: "all" });
        });
      }

      /* ── Pointer depth + grid spotlight (fine pointers only) ────── */
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        const layers = gsap.utils.toArray<HTMLElement>("[data-depth]", root).map((el) => ({
          k: parseFloat(el.dataset.depth ?? "0"),
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
        }));

        const spot = root.querySelector<HTMLElement>("[data-hero-spot]");
        const cur = { x: 0, y: 0 };
        const tgt = { x: 0, y: 0 };
        let raf = 0;
        let spotOn = false;
        const follow = () => {
          cur.x += (tgt.x - cur.x) * 0.18;
          cur.y += (tgt.y - cur.y) * 0.18;
          spot?.style.setProperty("--sx", `${cur.x.toFixed(1)}px`);
          spot?.style.setProperty("--sy", `${cur.y.toFixed(1)}px`);
          raf = Math.abs(tgt.x - cur.x) + Math.abs(tgt.y - cur.y) > 0.5 ? requestAnimationFrame(follow) : 0;
        };

        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          const px = e.clientX - r.left;
          const py = e.clientY - r.top;
          const nx = (px / r.width) * 2 - 1;
          const ny = (py / r.height) * 2 - 1;
          layers.forEach((l) => {
            l.x(nx * l.k * 9);
            l.y(ny * l.k * 6);
          });
          if (spot) {
            tgt.x = px;
            tgt.y = py;
            if (!spotOn) {
              spotOn = true;
              cur.x = px;
              cur.y = py;
              gsap.to(spot, { opacity: 1, duration: 0.5, ease: "silk" });
            }
            if (!raf) raf = requestAnimationFrame(follow);
          }
        };
        const onLeave = () => {
          layers.forEach((l) => {
            l.x(0);
            l.y(0);
          });
          if (spot && spotOn) {
            spotOn = false;
            gsap.to(spot, { opacity: 0, duration: 0.6, ease: "silk" });
          }
        };
        root.addEventListener("pointermove", onMove, { passive: true });
        root.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
          cancelAnimationFrame(raf);
          layers.forEach((l) => {
            l.x(0);
            l.y(0);
          });
          if (spot) gsap.set(spot, { clearProps: "opacity" });
        });
      }

      /* ── Scroll exit: headline rows slide apart, scrubbed ───────── */
      const items = gsap.utils.toArray<HTMLElement>("[data-hero-line-item]", root);
      if (items.length) {
        // Row index from each word's offsetTop (re-read on every refresh, so it follows the wrap).
        const rowOf = (el: HTMLElement) => {
          const tops = Array.from(new Set(items.map((n) => n.offsetTop))).sort((a, b) => a - b);
          const rows: number[] = [];
          tops.forEach((t) => {
            if (!rows.length || t - rows[rows.length - 1] > 12) rows.push(t);
          });
          const mine = el.offsetTop;
          let idx = 0;
          rows.forEach((t, n) => {
            if (mine >= t - 12) idx = n;
          });
          return idx;
        };
        const slide = gsap.to(items, {
          x: (_i: number, el: HTMLElement) =>
            (rowOf(el) % 2 === 0 ? -1 : 1) * Math.min(window.innerWidth * 0.12, 240),
          opacity: 0,
          ease: "power2.in",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "70% top",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        cleanups.push(() => {
          slide.scrollTrigger?.kill();
          slide.kill();
          gsap.set(items, { clearProps: "transform,opacity" });
        });
      }

      return () => cleanups.forEach((fn) => fn());
    });

    return () => mm.revert();
  });

  return null;
}
