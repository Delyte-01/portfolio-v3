"use client";

/**
 * Hero logo mark slot (spec: 3d-model-animation.md section 5).
 *
 * Server markup: a reserved square (no layout shift) holding a static, flat poster of the icon. It is
 * visible from 1024 px up only (see `.hero-mark` in globals.css); phones and small tablets render nothing.
 *
 * On a capable desktop (mouse, motion allowed, WebGL2, enough memory and cores, no data saver) the live
 * 3D mark is loaded LAZILY: after the loader has revealed the page and the browser is idle. `three` and
 * React Three Fiber live in hero-mark-canvas.tsx and are only ever imported from here via next/dynamic.
 *
 * Everything degrades to the poster: no JS, reduced motion, touch laptops, low-power devices, no WebGL2,
 * a failed chunk, a lost GPU context or a device that cannot hold the frame rate.
 */

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ICON, LOGO_BOX, LOGO_COLORS } from "@/components/brand/logo-parts";
import { gsap } from "@/lib/gsap";
import { DESKTOP_FINE } from "@/lib/motion";
import { get3DTier } from "@/lib/webgl-tier";

// Loaded only when this component renders it (after the gate passes), never as part of the page bundle.
const Scene = dynamic(() => import("./hero-mark-canvas"), { ssr: false });

/** Any error in the chunk, the geometry or the canvas leaves the poster in place. */
class Boundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Calls `cb` once the loader has revealed the page AND the browser is idle. Returns a canceller. */
function whenReady(cb: () => void): () => void {
  let cancelled = false;
  let started = false;
  const undo: Array<() => void> = [];

  const idle = () => {
    if (cancelled) return;
    const run = () => {
      if (!cancelled) cb();
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      undo.push(() => window.cancelIdleCallback(id));
    } else {
      const id = window.setTimeout(run, 300);
      undo.push(() => window.clearTimeout(id));
    }
  };

  const go = () => {
    if (started) return;
    started = true;
    idle();
  };

  if (document.documentElement.dataset.loader === "play") {
    window.addEventListener("delyte:reveal", go, { once: true });
    const failsafe = window.setTimeout(go, 6000);
    undo.push(() => {
      window.removeEventListener("delyte:reveal", go);
      window.clearTimeout(failsafe);
    });
  } else {
    go();
  }

  return () => {
    cancelled = true;
    undo.forEach((fn) => fn());
  };
}

export function HeroMark() {
  const posterRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  /** Set when the canvas failed or gave up: the poster stays for the rest of this page view. */
  const dead = useRef(false);

  // Gate: mount or unmount the canvas live as the media query (width, pointer, reduced motion) changes.
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_FINE);
    let cancelPending: (() => void) | null = null;

    const schedule = () => {
      cancelPending?.();
      cancelPending = null;
      if (dead.current || !mq.matches || get3DTier() !== "full") return;
      cancelPending = whenReady(() => setMounted(true));
    };
    const onChange = () => {
      cancelPending?.();
      cancelPending = null;
      setMounted(false);
      schedule();
    };

    schedule();
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      cancelPending?.();
    };
  }, []);

  const giveUp = useCallback(() => {
    dead.current = true;
    setMounted(false);
  }, []);

  // First frames are on screen: crossfade poster -> canvas. Only opacity and transform animate.
  const onReady = useCallback(() => {
    const canvas = canvasRef.current;
    const poster = posterRef.current;
    if (canvas) gsap.fromTo(canvas, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.9, ease: "sleek" });
    if (poster) gsap.to(poster, { autoAlpha: 0, duration: 0.5, ease: "sleekOut" });
  }, []);

  // When the canvas goes away (gate closed, gave up, unmount) put the poster back exactly as rendered.
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    const poster = posterRef.current;
    return () => {
      const targets = [canvas, poster].filter((el): el is HTMLDivElement => Boolean(el));
      gsap.killTweensOf(targets);
      if (poster) gsap.set(poster, { clearProps: "opacity,visibility" });
    };
  }, [mounted]);

  const { x, y, w, h } = LOGO_BOX.icon;

  return (
    <div data-depth="2.2" className="hero-mark" aria-hidden="true">
      <div ref={posterRef} className="hero-mark__poster">
        <svg viewBox={`${x} ${y} ${w} ${h}`} className="size-full" focusable="false">
          <g fill={LOGO_COLORS.icon}>
            {ICON.map((p, i) => (
              <path key={i} d={p.d} transform={p.m} />
            ))}
          </g>
        </svg>
      </div>

      {mounted ? (
        <div ref={canvasRef} className="hero-mark__canvas">
          <Boundary onError={giveUp}>
            <Scene onReady={onReady} onGiveUp={giveUp} />
          </Boundary>
        </div>
      ) : null}
    </div>
  );
}
