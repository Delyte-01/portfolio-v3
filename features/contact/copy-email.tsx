"use client";

import { useEffect, useRef } from "react";

import { playCopyBurst } from "@/components/motion/micro/contact";
import { gsap } from "@/lib/gsap";
import { DESKTOP_FINE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Clipboard API first; a temporary textarea for browsers or contexts that block it. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the textarea fallback */
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

const SHOW_MS = 1600;

/**
 * F16, copy the email address (spec: gsap-animation.md).
 * Works on every device: it copies, swaps its label to "Copied" for 1.6 s and announces
 * "Email copied" in a polite live region. Only the roll of the label and the dot burst are
 * GSAP, and they run only inside the desktop media query. Works from the keyboard (Enter / Space)
 * because it is a real button.
 */
export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const idleRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const busy = useRef(false);
  const timer = useRef(0);

  useEffect(() => {
    const idle = idleRef.current;
    const done = doneRef.current;
    return () => {
      window.clearTimeout(timer.current);
      if (idle && done) gsap.killTweensOf([idle, done]);
    };
  }, []);

  /** Swaps the two labels. `animate` rolls them upward with GSAP; otherwise it is a plain swap. */
  const show = (copied: boolean, animate: boolean, onDone?: () => void) => {
    const idle = idleRef.current;
    const done = doneRef.current;
    if (!idle || !done) return onDone?.();
    gsap.killTweensOf([idle, done]);

    if (!animate) {
      gsap.set([idle, done], { clearProps: "transform" });
      idle.style.visibility = copied ? "hidden" : "visible";
      done.style.visibility = copied ? "visible" : "hidden";
      return onDone?.();
    }

    const [out, into] = copied ? [idle, done] : [done, idle];
    out.style.visibility = "visible";
    into.style.visibility = "visible";
    gsap.fromTo(out, { yPercent: 0 }, { yPercent: -100, duration: 0.5, ease: "sleek" });
    gsap.fromTo(into, { yPercent: 100 }, {
      yPercent: 0,
      duration: 0.5,
      ease: "sleek",
      onComplete: () => {
        out.style.visibility = "hidden";
        gsap.set([idle, done], { clearProps: "transform" });
        onDone?.();
      },
    });
  };

  const onClick = async () => {
    // Ignore clicks while a copy is still showing (no double bursts). The button stays focusable.
    if (busy.current) return;
    busy.current = true;

    const status = statusRef.current;
    const ok = await copyText(email);
    if (!ok) {
      if (status) status.textContent = "Could not copy the email";
      busy.current = false;
      return;
    }

    const animate = window.matchMedia(DESKTOP_FINE).matches;
    if (status) status.textContent = "Email copied";
    show(true, animate);
    if (animate && hostRef.current) void playCopyBurst(hostRef.current);

    timer.current = window.setTimeout(() => {
      show(false, window.matchMedia(DESKTOP_FINE).matches, () => {
        busy.current = false;
        if (status) status.textContent = "";
      });
    }, SHOW_MS);
  };

  return (
    <span ref={hostRef} className={cn("relative inline-flex", className)}>
      <button
        type="button"
        data-copy-email=""
        onClick={onClick}
        className="relative inline-flex min-h-12 w-full select-none items-center justify-center rounded-full border border-white/70 px-7 text-sm font-medium tracking-tight whitespace-nowrap text-white transition-[color,background-color,border-color] duration-300 ease-[var(--ease-atelier)] hover:border-white hover:bg-white hover:text-ink"
      >
        <span className="relative block overflow-hidden">
          <span ref={idleRef} className="block">
            Copy email
          </span>
          <span
            ref={doneRef}
            aria-hidden
            className="absolute inset-0 block text-center"
            style={{ visibility: "hidden" }}
          >
            Copied
          </span>
        </span>
      </button>
      <span ref={statusRef} role="status" aria-live="polite" className="sr-only" />
    </span>
  );
}
