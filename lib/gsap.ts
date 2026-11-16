"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Draggable } from "gsap/Draggable";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { useGSAP } from "@gsap/react";

/** Register plugins and create the custom eases exactly once, from a single module. */
if (typeof window !== "undefined") {
  gsap.registerPlugin(
    ScrollTrigger,
    SplitText,
    CustomEase,
    MotionPathPlugin,
    DrawSVGPlugin,
    Draggable,
    ScrambleTextPlugin,
    useGSAP,
  );

  // Phones resize the viewport constantly as the URL bar shows/hides.
  // Without this, every tiny resize would refresh all triggers and cause jumps.
  ScrollTrigger.config({ ignoreMobileResize: true });

  /**
   * Custom easing family. All are cubic-béziers with long, soft tails so
   * motion lands gently instead of snapping to a stop.
   *  silk   – entrances: quick start, very long settle (text, cards)
   *  glide  – symmetrical in/out (clip-path masks, page wipe, scroll-to)
   *  settle – ultra-slow tail for large surfaces (images scaling down)
   *  pop    – tiny overshoot for small floating things (hover preview, back-to-top)
   *
   * Sleek family (desktop micro-interactions, spec: gsap-animation.md §2). Smooth acceleration
   * with no instant jump, then a long glide to rest, so hover motion still feels calm right
   * after Lenis has been easing the scroll underneath it.
   *  sleek       – default for hover in, reveals and state changes
   *  sleekOut    – accelerating exit: things leaving, fades out
   *  sleekSpring – release / snap-back with a tiny (~3 %) overshoot
   */
  CustomEase.create("silk", "0.22, 1, 0.36, 1");
  CustomEase.create("glide", "0.65, 0, 0.35, 1");
  CustomEase.create("settle", "0.19, 1, 0.22, 1");
  CustomEase.create("pop", "0.34, 1.45, 0.64, 1");
  CustomEase.create("sleek", "0.2, 0, 0, 1");
  CustomEase.create("sleekOut", "0.3, 0, 0.8, 0.15");
  CustomEase.create("sleekSpring", "0.34, 1.3, 0.5, 1");
}

export {
  gsap,
  ScrollTrigger,
  SplitText,
  CustomEase,
  MotionPathPlugin,
  DrawSVGPlugin,
  Draggable,
  ScrambleTextPlugin,
  useGSAP,
};

export const EASE = {
  silk: "silk",
  glide: "glide",
  settle: "settle",
  pop: "pop",
  sleek: "sleek",
  sleekOut: "sleekOut",
  sleekSpring: "sleekSpring",
  /** Legacy aliases, kept so existing imports keep working. */
  atelier: "silk",
  inOut: "glide",
} as const;
