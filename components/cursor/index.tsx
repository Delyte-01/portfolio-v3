"use client";

import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import { DESKTOP_FINE, cleanupBag, isTouch, on, rafCoalesce } from "@/lib/motion";

/**
 * F1, custom cursor with context states (spec: gsap-animation.md).
 *
 * A small follower that grows on links, becomes an orange "View" bubble over project visuals and
 * a "Drag" bubble over draggable cards. The native cursor stays visible: this is an accessory.
 * Desktop with a mouse and no reduced motion only; everywhere else nothing is created.
 *
 * The dot and the bubble are two separate fixed layers on purpose: `mix-blend-mode` only blends
 * with the page when the blending element is not inside another stacking context, and a fixed
 * wrapper with a z-index would be one.
 */

type CursorState = "default" | "link" | "view" | "drag" | "hidden";

const resolveState = (target: EventTarget | null): CursorState => {
  if (!(target instanceof Element)) return "default";
  if (target.closest("iframe, select, input, textarea")) return "hidden";
  const tagged = target.closest<HTMLElement>("[data-cursor]")?.dataset.cursor;
  if (tagged === "view" || tagged === "drag" || tagged === "link") return tagged;
  if (target.closest("a, button, [role=button], summary")) return "link";
  return "default";
};

export function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const dot = root?.querySelector<HTMLElement>("[data-cursor-dot]");
      const bubble = root?.querySelector<HTMLElement>("[data-cursor-bubble]");
      const label = root?.querySelector<HTMLElement>("[data-cursor-label]");
      if (!root || !dot || !bubble || !label) return;

      const mm = gsap.matchMedia();
      mm.add(DESKTOP_FINE, () => {
        const bag = cleanupBag();
        const html = document.documentElement;

        gsap.set(root, { autoAlpha: 0 });
        gsap.set(dot, { scale: 1 });
        gsap.set(bubble, { scale: 0 });

        const dotX = gsap.quickTo(dot, "x", { duration: 0.18, ease: "silk" });
        const dotY = gsap.quickTo(dot, "y", { duration: 0.18, ease: "silk" });
        const bubX = gsap.quickTo(bubble, "x", { duration: 0.6, ease: "silk" });
        const bubY = gsap.quickTo(bubble, "y", { duration: 0.6, ease: "silk" });

        let x = 0;
        let y = 0;
        let moved = false;
        let revealed = html.dataset.loader !== "play";
        let inWindow = true;
        let state: CursorState = "default";
        let shown = false;

        // ── Visibility: one place decides whether the cursor layer is on screen ──
        const syncVisibility = () => {
          const want = revealed && moved && inWindow && !document.hidden && state !== "hidden";
          if (want === shown) return;
          shown = want;
          gsap.to(root, {
            autoAlpha: want ? 1 : 0,
            duration: want ? 0.4 : 0.3,
            ease: want ? "sleek" : "sleekOut",
            overwrite: "auto",
          });
        };

        // ── State: dot and bubble morph together ──
        const apply = (next: CursorState) => {
          if (next === state) return;
          state = next;
          const isBubble = next === "view" || next === "drag";
          if (isBubble) label.textContent = next === "view" ? "View" : "Drag";
          gsap.to(dot, {
            scale: isBubble ? 0 : next === "link" ? 3.4 : 1,
            duration: 0.5,
            ease: "sleek",
            overwrite: "auto",
          });
          gsap.to(bubble, {
            scale: isBubble ? 1 : 0,
            duration: isBubble ? 0.55 : 0.4,
            ease: isBubble ? "pop" : "sleek",
            overwrite: "auto",
          });
          syncVisibility();
        };

        // ── Follow ──
        const onMove = (e: PointerEvent) => {
          if (isTouch(e)) return;
          x = e.clientX;
          y = e.clientY;
          if (!moved) {
            // First move: land on the pointer instead of flying in from (0, 0).
            moved = true;
            gsap.set([dot, bubble], { x, y });
          } else {
            dotX(x);
            dotY(y);
            bubX(x);
            bubY(y);
          }
          if (!inWindow) inWindow = true;
          syncVisibility();
        };

        const onOver = (e: PointerEvent) => {
          if (isTouch(e)) return;
          apply(resolveState(e.target));
        };

        // Lenis scrolls the page under a still pointer: re-resolve the state from what is under it.
        const resample = rafCoalesce(() => {
          if (!moved) return;
          apply(resolveState(document.elementFromPoint(x, y)));
        });

        // ── Press feedback (only while the bubble is showing) ──
        const onDown = (e: PointerEvent) => {
          if (isTouch(e) || (state !== "view" && state !== "drag")) return;
          gsap.to(bubble, { scale: 0.88, duration: 0.15, ease: "sleek", overwrite: "auto" });
        };
        const onUp = () => {
          if (state !== "view" && state !== "drag") return;
          gsap.to(bubble, { scale: 1, duration: 0.6, ease: "sleekSpring", overwrite: "auto" });
        };

        const onLeaveWindow = () => {
          inWindow = false;
          syncVisibility();
        };
        const onEnterWindow = () => {
          inWindow = true;
          syncVisibility();
        };

        bag.add(on<PointerEvent>(window, "pointermove", onMove, { passive: true }));
        bag.add(on<PointerEvent>(document, "pointerover", onOver, { passive: true }));
        bag.add(on<PointerEvent>(window, "pointerdown", onDown, { capture: true, passive: true }));
        bag.add(on(window, "pointerup", onUp, { capture: true, passive: true }));
        bag.add(on(window, "pointercancel", onUp, { capture: true, passive: true }));
        bag.add(on(html, "pointerleave", onLeaveWindow));
        bag.add(on(html, "pointerenter", onEnterWindow));
        bag.add(on(window, "blur", onLeaveWindow));
        bag.add(on(window, "focus", onEnterWindow));
        bag.add(on(document, "visibilitychange", syncVisibility));
        bag.add(on(window, "scroll", () => resample(), { passive: true }));
        bag.add(() => resample.cancel());

        // ── Loader hand-off: stay hidden until the loading screen has revealed the page ──
        if (!revealed) {
          const go = () => {
            revealed = true;
            syncVisibility();
          };
          const failsafe = window.setTimeout(go, 6000);
          bag.add(on(window, "delyte:reveal", go, { once: true }));
          bag.add(() => window.clearTimeout(failsafe));
        }

        return () => {
          bag.run();
          gsap.killTweensOf([root, dot, bubble]);
          // Hidden again by default; the inline style is what keeps the layer invisible elsewhere.
          gsap.set([dot, bubble], { clearProps: "transform" });
          gsap.set(root, { clearProps: "opacity" });
          root.style.visibility = "hidden";
          label.textContent = "";
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} data-cursor-root aria-hidden="true" className="hidden lg:block" style={{ visibility: "hidden" }}>
      <div
        data-cursor-dot
        className="pointer-events-none fixed left-0 top-0 z-[150] -ml-[5px] -mt-[5px] size-[10px] rounded-full bg-white mix-blend-difference"
      />
      <div
        data-cursor-bubble
        className="pointer-events-none fixed left-0 top-0 z-[150] -ml-[44px] -mt-[44px] grid size-[88px] place-items-center rounded-full bg-[#D72B0C] text-white"
      >
        <span data-cursor-label className="t-meta" />
      </div>
    </div>
  );
}
