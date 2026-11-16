"use client";

/**
 * Hover preview for the "More work" list (desktop with a mouse only).
 *
 * One floating frame follows the pointer. Hovering a row reveals that project's screenshot:
 * the frame pops in, then moving between rows wipes the next image in with a clip-path while
 * the picture settles from a slight zoom. A small tilt follows pointer speed.
 * Motion: custom eases "pop", "glide", "silk" and "settle" (see lib/gsap.ts); transform,
 * opacity and clip-path only. The preview is decorative (aria-hidden): every row is a real link.
 */

import Image from "next/image";
import { useRef } from "react";

import { gsap, useGSAP } from "@/lib/gsap";
import type { Project } from "@/lib/data/projects";

const W = 352; // frame width in px (matches w-[22rem])
const OFFSET = 32; // gap between the pointer and the frame

export function ArchivePreview({ projects }: { projects: readonly Project[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const withImage = projects.filter((p) => p.image);

  useGSAP(
    () => {
      const root = rootRef.current;
      const scope = root?.closest<HTMLElement>("[data-archive]");
      if (!root || !scope) return;

      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
        () => {
          const slides = gsap.utils.toArray<HTMLElement>("[data-preview-slide]", root);
          const label = root.querySelector<HTMLElement>("[data-preview-label]");
          const index = root.querySelector<HTMLElement>("[data-preview-index]");

          gsap.set(root, { autoAlpha: 0, scale: 0.8, rotation: -5 });
          gsap.set(slides, { autoAlpha: 0 });

          const xTo = gsap.quickTo(root, "x", { duration: 0.75, ease: "silk" });
          const yTo = gsap.quickTo(root, "y", { duration: 0.75, ease: "silk" });
          const rTo = gsap.quickTo(root, "rotation", { duration: 0.9, ease: "settle" });
          const settleTilt = gsap.delayedCall(0.14, () => rTo(0)).pause();

          let current: HTMLElement | null = null;
          let visible = false;
          let lastX = 0;
          let lastY = 0;

          const place = (x: number, y: number, instant: boolean) => {
            const h = root.offsetHeight || 260;
            const flip = x + OFFSET + W > window.innerWidth - 16;
            const tx = flip ? x - OFFSET - W : x + OFFSET;
            const ty = gsap.utils.clamp(16, Math.max(16, window.innerHeight - h - 16), y - h / 2);
            if (instant) gsap.set(root, { x: tx, y: ty });
            else {
              xTo(tx);
              yTo(ty);
            }
          };

          const show = (row: HTMLElement) => {
            const slide = slides.find((s) => s.dataset.slug === row.dataset.slug);
            if (!slide || slide === current) return;
            const prev = current;
            current = slide;

            if (label) label.textContent = slide.dataset.title ?? "";
            if (index) index.textContent = slide.dataset.index ?? "";

            if (!visible) {
              visible = true;
              place(lastX, lastY, true);
              gsap.set(slides, { autoAlpha: 0, zIndex: 1 });
              gsap.set(slide, { autoAlpha: 1, zIndex: 2, clipPath: "inset(0% 0% 0% 0%)" });
              gsap.fromTo(
                slide.firstElementChild as Element,
                { scale: 1.2 },
                { scale: 1, duration: 1.1, ease: "settle", overwrite: "auto" },
              );
              gsap.to(root, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "pop", overwrite: "auto" });
              rTo(0);
              return;
            }

            // Already open: wipe the next screenshot in from the bottom over the previous one.
            gsap.set(slides, { zIndex: 1 });
            gsap.fromTo(
              slide,
              { autoAlpha: 1, zIndex: 2, clipPath: "inset(100% 0% 0% 0%)" },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 0.75,
                ease: "glide",
                overwrite: "auto",
                onComplete: () => {
                  if (prev && prev !== current) gsap.set(prev, { autoAlpha: 0 });
                },
              },
            );
            gsap.fromTo(
              slide.firstElementChild as Element,
              { scale: 1.2 },
              { scale: 1, duration: 1.1, ease: "settle", overwrite: "auto" },
            );
          };

          const hide = () => {
            if (!visible) return;
            visible = false;
            current = null;
            gsap.to(root, { autoAlpha: 0, scale: 0.88, duration: 0.4, ease: "silk", overwrite: "auto" });
          };

          const rowAt = (target: EventTarget | null) =>
            target instanceof Element ? target.closest<HTMLElement>("[data-archive-row]") : null;

          const onMove = (e: PointerEvent) => {
            lastX = e.clientX;
            lastY = e.clientY;
            const row = rowAt(e.target);
            if (!row) return hide();
            show(row);
            if (visible) {
              place(lastX, lastY, false);
              rTo(gsap.utils.clamp(-9, 9, e.movementX * 0.35));
              settleTilt.restart(true);
            }
          };

          // Lenis scrolls the page under a still pointer: re-check which row is under it.
          let raf = 0;
          const onScroll = () => {
            if (raf || !visible) return;
            raf = requestAnimationFrame(() => {
              raf = 0;
              const row = rowAt(document.elementFromPoint(lastX, lastY));
              if (!row) hide();
              else {
                show(row);
                place(lastX, lastY, false);
              }
            });
          };

          // Keyboard users get the same preview when a row's link receives focus.
          const onFocusIn = (e: FocusEvent) => {
            const row = rowAt(e.target);
            if (!row) return;
            const r = row.getBoundingClientRect();
            lastX = r.left + r.width * 0.55;
            lastY = r.top + r.height / 2;
            show(row);
            place(lastX, lastY, false);
          };
          const onFocusOut = (e: FocusEvent) => {
            if (!rowAt(e.relatedTarget)) hide();
          };

          scope.addEventListener("pointermove", onMove, { passive: true });
          scope.addEventListener("pointerleave", hide);
          scope.addEventListener("focusin", onFocusIn);
          scope.addEventListener("focusout", onFocusOut);
          window.addEventListener("scroll", onScroll, { passive: true });

          return () => {
            scope.removeEventListener("pointermove", onMove);
            scope.removeEventListener("pointerleave", hide);
            scope.removeEventListener("focusin", onFocusIn);
            scope.removeEventListener("focusout", onFocusOut);
            window.removeEventListener("scroll", onScroll);
            if (raf) cancelAnimationFrame(raf);
          };
        },
      );

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[60] hidden w-[22rem] md:block"
      style={{ visibility: "hidden", opacity: 0 }}
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border-2 border-ink bg-ink shadow-[8px_8px_0_0_var(--ink)]">
        {withImage.map((p) => (
          <div
            key={p.slug}
            data-preview-slide
            data-slug={p.slug}
            data-title={p.title}
            data-index={p.index}
            className="absolute inset-0 invisible"
          >
            <div className="absolute inset-0">
              <Image
                src={p.image as string}
                alt=""
                fill
                sizes="352px"
                className="object-cover object-top"
              />
            </div>
          </div>
        ))}
      </div>
      <p className="t-meta mt-3 flex items-center gap-2">
        <span data-preview-index className="grid size-7 place-items-center rounded-full bg-ink text-white" />
        <span data-preview-label className="rounded-full bg-white px-3 py-1 text-ink" />
      </p>
    </div>
  );
}
