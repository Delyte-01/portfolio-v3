/**
 * Shared helpers for the desktop micro-interaction layer (spec: gsap-animation.md §3.2).
 * Pure DOM utilities: no GSAP import, so this file is safe to load anywhere.
 */

/** Every effect in gsap-animation.md runs only inside this media query and nowhere else. */
export const DESKTOP_FINE =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/** A function that undoes everything an `init*` function set up. */
export type Cleanup = () => void;

/** Returned by an `init*` function when there is nothing to do on this page. */
export const noop: Cleanup = () => {};

/** Clamp helper so micro modules do not import gsap.utils everywhere. */
export const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v));

/** Attach a listener and return its remover (keeps cleanup one-liners). */
export function on<E extends Event = Event>(
  el: EventTarget,
  type: string,
  fn: (e: E) => void,
  opts?: AddEventListenerOptions,
): Cleanup {
  el.addEventListener(type, fn as EventListener, opts);
  return () => el.removeEventListener(type, fn as EventListener, opts);
}

/** Normalised pointer position inside a rect: -1..1 on both axes (0 = centre). */
export const norm = (e: { clientX: number; clientY: number }, r: DOMRect) => ({
  nx: clamp(-1, 1, ((e.clientX - r.left) / r.width) * 2 - 1),
  ny: clamp(-1, 1, ((e.clientY - r.top) / r.height) * 2 - 1),
});

/** Same as `norm`, from plain coordinates. */
export const normXY = (x: number, y: number, r: DOMRect) => norm({ clientX: x, clientY: y }, r);

/** `querySelectorAll` as a real array. */
export const qsa = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] =>
  Array.from(root.querySelectorAll<T>(selector));

/** Touch pointers on hybrid laptops must never drive hover effects. */
export const isTouch = (e: PointerEvent) => e.pointerType === "touch";

/** Coalesce calls into one per animation frame (the latest argument wins). */
export function rafCoalesce<A extends unknown[]>(fn: (...args: A) => void) {
  let id = 0;
  let latest: A | null = null;
  const run = (...args: A) => {
    latest = args;
    if (id) return;
    id = requestAnimationFrame(() => {
      id = 0;
      if (latest) fn(...latest);
    });
  };
  run.cancel = () => {
    if (id) cancelAnimationFrame(id);
    id = 0;
    latest = null;
  };
  return run;
}

/**
 * Runs `fn` at most once per frame while the page scrolls. Lenis moves content under a still
 * pointer and `pointermove` does not fire then, so hover effects use this to re-sample.
 */
export function onScrollFrame(fn: () => void): Cleanup {
  const frame = rafCoalesce(fn);
  const off = on(window, "scroll", () => frame(), { passive: true });
  return () => {
    off();
    frame.cancel();
  };
}

export interface HoverTrackerOptions<T extends HTMLElement> {
  /** Which tracked element (if any) a pointer target belongs to. */
  find: (target: EventTarget | null) => T | null;
  /** The pointer arrived over `el`. */
  enter: (el: T, x: number, y: number) => void;
  /** The pointer moved over `el` (one call per frame at most). Also called after scroll frames. */
  move: (el: T, x: number, y: number) => void;
  /** The pointer left `el`, or the page scrolled it away from under the pointer. */
  leave: (el: T) => void;
  /** Page scrolled while `el` is active: refresh cached rects here (once per frame). */
  scroll?: (el: T) => void;
}

/**
 * One delegated, passive `pointermove` listener per scope (spec §1: "one listener per section").
 * Tracks which element is under the pointer, fires enter / move / leave, and re-samples with
 * `elementFromPoint` while Lenis scrolls the page under a still pointer (spec §2.3 rule 6).
 */
export function trackHover<T extends HTMLElement>(scope: HTMLElement, o: HoverTrackerOptions<T>): Cleanup {
  let active: T | null = null;
  let x = 0;
  let y = 0;

  const setActive = (next: T | null) => {
    if (next === active) return;
    const prev = active;
    active = next;
    if (prev) o.leave(prev);
    if (next) o.enter(next, x, y);
  };

  const frame = rafCoalesce(() => {
    if (active) o.move(active, x, y);
  });

  const onMove = (e: PointerEvent) => {
    if (isTouch(e)) return;
    x = e.clientX;
    y = e.clientY;
    setActive(o.find(e.target));
    frame();
  };
  const onLeave = (e: PointerEvent) => {
    if (isTouch(e)) return;
    setActive(null);
    frame.cancel();
  };

  const offScroll = onScrollFrame(() => {
    if (!active) return;
    const under = o.find(document.elementFromPoint(x, y));
    if (under !== active) {
      setActive(under);
      if (active) o.move(active, x, y);
      return;
    }
    o.scroll?.(active);
    o.move(active, x, y);
  });

  const offMove = on<PointerEvent>(scope, "pointermove", onMove, { passive: true });
  const offLeave = on<PointerEvent>(scope, "pointerleave", onLeave);

  return () => {
    offMove();
    offLeave();
    offScroll();
    frame.cancel();
    if (active) {
      const prev = active;
      active = null;
      o.leave(prev);
    }
  };
}

/** Collects removers and runs them once, in reverse order. */
export function cleanupBag() {
  const fns: Cleanup[] = [];
  return {
    add(fn: Cleanup | undefined | null) {
      if (fn) fns.push(fn);
    },
    run() {
      while (fns.length) {
        try {
          fns.pop()?.();
        } catch {
          /* one failing cleanup must never block the others */
        }
      }
    },
  };
}
