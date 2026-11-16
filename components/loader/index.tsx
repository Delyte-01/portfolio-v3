"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { EASE, gsap, useGSAP } from "@/lib/gsap";
import { site } from "@/lib/site";
import { LOGO, LogoMark } from "./logo-mark";

/**
 * Loading screen. Full spec: animated.md.
 *
 * Plays once per session, on "/" only, never for reduced motion. The decision is made by
 * a tiny script in <head> (see app/layout.tsx) which sets html[data-loader="play|skip"]
 * before first paint, so skipped visits never flash the overlay.
 *
 * Hand-off: at `reveal` the loader sets data-loader="done" and fires the window event
 * "delyte:reveal"; PageMotion then starts the hero timeline.
 */

/** Every number that shapes the animation. Times are seconds from timeline start. */
const T = {
  desktop: {
    icon: { at: 0, dur: 0.7, stagger: 0.06 },
    letters: { at: 0.3, dur: 1.0, stagger: 0.09, fadeDur: 0.45, rise: 1.2 },
    rule: { at: 0.85, dur: 0.9 },
    tagline: { at: 0.95, dur: 0.8 },
    counter: { at: 0.2, fadeDur: 0.5, dur: 1.4 },
    hold: 1.6, // exit starts here (once the page is ready)
    exitText: { dur: 0.4 },
    exitLetters: { dur: 0.7, stagger: 0.05, delay: 0.05 },
    exitIcon: { dur: 0.6, lift: 0.6, delay: 0.1 },
    curtain: { delay: 0.35, dur: 0.9 }, // relative to `hold`
    reveal: 0.65, // relative to `hold` (curtain about half open)
  },
  mobile: {
    icon: { at: 0, dur: 0.53, stagger: 0.05 },
    letters: { at: 0.22, dur: 0.75, stagger: 0.07, fadeDur: 0.34, rise: 1.0 },
    rule: { at: 0.64, dur: 0.68 },
    tagline: { at: 0.71, dur: 0.6 },
    counter: { at: 0.15, fadeDur: 0.38, dur: 1.05 },
    hold: 1.2,
    exitText: { dur: 0.3 },
    exitLetters: { dur: 0.53, stagger: 0.04, delay: 0.04 },
    exitIcon: { dur: 0.45, lift: 0.6, delay: 0.08 },
    curtain: { delay: 0.15, dur: 0.75 },
    reveal: 0.5,
  },
} as const;

type Profile = (typeof T)[keyof typeof T];

/** Longest we will wait for fonts + window load before leaving anyway. */
const GATE_CAP_MS = 4000;

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  // Lenis is created after this component's first effect, so keep the latest instance in a ref.
  const lenis = useLenis();
  const lenisRef = useRef<typeof lenis>(undefined);
  const lockedRef = useRef(false);
  useEffect(() => {
    lenisRef.current = lenis;
    if (lenis && lockedRef.current) lenis.stop();
  }, [lenis]);

  useGSAP(
    () => {
      const el = root.current;
      const html = document.documentElement;
      if (!el) return;

      const markDone = () => {
        html.dataset.loader = "done";
        try {
          sessionStorage.setItem("delyte:loaded", "1");
        } catch {
          /* storage can be blocked; the loader then simply plays again next visit */
        }
      };

      // Skipped visit, or the CSS failsafe already hid the overlay: nothing to play.
      if (html.dataset.loader !== "play" || getComputedStyle(el).visibility === "hidden") {
        markDone();
        window.dispatchEvent(new Event("delyte:reveal"));
        queueMicrotask(() => setDone(true));
        return;
      }

      const mm = gsap.matchMedia();
      let cancelled = false;
      let revealed = false;

      const lock = () => {
        lockedRef.current = true;
        html.classList.add("is-loading");
        lenisRef.current?.stop();
        window.scrollTo(0, 0);
      };
      const unlock = () => {
        lockedRef.current = false;
        html.classList.remove("is-loading");
        lenisRef.current?.start();
      };
      const reveal = () => {
        if (revealed) return;
        revealed = true;
        unlock();
        markDone();
        window.dispatchEvent(new Event("delyte:reveal"));
      };

      // Page readiness: fonts + window load, capped so a slow asset never traps the visitor.
      const loaded = new Promise<void>((resolve) => {
        if (document.readyState === "complete") resolve();
        else window.addEventListener("load", () => resolve(), { once: true });
      });
      const gate = Promise.race([
        Promise.all([document.fonts?.ready ?? Promise.resolve(), loaded]),
        new Promise((resolve) => window.setTimeout(resolve, GATE_CAP_MS)),
      ]);

      const play = (c: Profile) => {
        const q = gsap.utils.selector(el);
        const icon = q("[data-part='icon']");
        const pieces = q("[data-part='icon-piece']");
        const letters = q("[data-part='letter']");
        const rule = q("[data-part='rule']");
        const tagline = q("[data-tagline]");
        const counter = q("[data-counter]");
        const counterEl = counter[0] as HTMLElement | undefined;
        const panelOut = LOGO.clipH * 1.2;
        const riseY = LOGO.clipH * c.letters.rise;

        lock();

        // ── Initial state (set before first paint) ──────────────────────
        gsap.set(pieces, { scale: 0, autoAlpha: 0, transformOrigin: "50% 50%" });
        gsap.set(letters, { y: riseY, autoAlpha: 0 });
        gsap.set(rule, { scaleX: 0, transformOrigin: "0% 50%" });
        gsap.set(tagline, { autoAlpha: 0, y: 8 });
        gsap.set(counter, { autoAlpha: 0 });
        if (counterEl) counterEl.textContent = "000";

        const tl = gsap.timeline();

        // ── Entrance ────────────────────────────────────────────────────
        tl.to(
          pieces,
          { scale: 1, autoAlpha: 1, duration: c.icon.dur, stagger: c.icon.stagger, ease: EASE.settle },
          c.icon.at,
        );
        tl.to(
          letters,
          { y: 0, duration: c.letters.dur, stagger: c.letters.stagger, ease: EASE.silk },
          c.letters.at,
        );
        tl.to(
          letters,
          { autoAlpha: 1, duration: c.letters.fadeDur, stagger: c.letters.stagger, ease: EASE.silk },
          c.letters.at,
        );
        tl.to(rule, { scaleX: 1, duration: c.rule.dur, ease: EASE.glide }, c.rule.at);
        tl.to(tagline, { autoAlpha: 1, y: 0, duration: c.tagline.dur, ease: EASE.silk }, c.tagline.at);
        tl.to(counter, { autoAlpha: 1, duration: c.counter.fadeDur, ease: EASE.silk }, c.counter.at);

        const n = { v: 0 };
        tl.to(
          n,
          {
            v: 100,
            duration: c.counter.dur,
            ease: EASE.glide,
            onUpdate: () => {
              if (counterEl) counterEl.textContent = String(Math.round(n.v)).padStart(3, "0");
            },
          },
          c.counter.at,
        );

        // ── Hold: wait here until the page is ready, then continue ──────
        tl.call(
          () => {
            tl.pause();
            gate.then(() => {
              if (!cancelled) tl.play();
            });
          },
          undefined,
          c.hold,
        );

        // ── Exit ────────────────────────────────────────────────────────
        const h = c.hold;
        tl.to(
          [tagline, counter],
          { autoAlpha: 0, y: -8, duration: c.exitText.dur, ease: EASE.glide },
          h,
        );
        tl.to(
          rule,
          { scaleX: 0, transformOrigin: "100% 50%", duration: c.exitText.dur, ease: EASE.glide },
          h,
        );
        tl.to(
          letters,
          {
            y: -panelOut,
            duration: c.exitLetters.dur,
            stagger: c.exitLetters.stagger,
            ease: EASE.glide,
          },
          h + c.exitLetters.delay,
        );
        tl.to(
          icon,
          {
            y: -LOGO.clipH * c.exitIcon.lift,
            autoAlpha: 0,
            duration: c.exitIcon.dur,
            ease: EASE.glide,
          },
          h + c.exitIcon.delay,
        );

        // Curtain wipes up.
        tl.to(
          el,
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: c.curtain.dur,
            ease: EASE.glide,
            onComplete: () => setDone(true),
          },
          h + c.curtain.delay,
        );

        // Hand-off to the hero while the curtain is about half open.
        tl.call(reveal, undefined, h + c.reveal);
      };

      mm.add("(min-width: 768px)", () => play(T.desktop));
      mm.add("(max-width: 767px)", () => play(T.mobile));

      return () => {
        cancelled = true;
        mm.revert();
        // If we are torn down mid-flight (e.g. strict-mode remount), never leave the page locked.
        if (!revealed) {
          lockedRef.current = false;
          html.classList.remove("is-loading");
          lenisRef.current?.start();
        }
      };
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <div
      ref={root}
      className="loader"
      role="status"
      aria-label="Loading Delyte portfolio"
    >
      <div className="loader__stack" aria-hidden="true">
        <LogoMark className="loader__logo" />
        <p className="loader__tagline" data-tagline>
          {site.role} · {site.location}
        </p>
      </div>
      <div className="loader__counter-wrap" aria-hidden="true">
        <span className="loader__counter" data-counter>
          000
        </span>
      </div>
    </div>
  );
}
