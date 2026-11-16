"use client";

/**
 * The live 3D hero mark (spec: 3d-model-animation.md section 5). Default export, imported ONLY through
 * next/dynamic from hero-mark.tsx, so `three` and React Three Fiber never reach the initial bundle.
 *
 * One canvas, one mesh (the 8 icon petals merged), one material, three lights. No shadows, textures,
 * environment map or post-processing. React Three Fiber (`useFrame`) owns the mesh transforms; GSAP
 * only animates a plain number (the intro offset), never the mesh. Nothing here touches the DOM
 * outside its own wrapper.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mesh } from "three";

import { gsap } from "@/lib/gsap";
import { clamp } from "@/lib/motion";
import { buildMarkGeometry } from "./mark-geometry";

// ── Tuning knobs (spec section 10) ───────────────────────────────────────
const SPIN_PERIOD = 10; // s per quarter turn (the icon is 4-fold symmetric, so it reads as endless)
const TILT_X = 0.32; // rad
const TILT_Y = 0.42; // rad
const DAMP = 4; // pointer follow, frame-rate independent
const SCROLL_TURN = 0.9; // extra rad as the hero scrolls away
const SCROLL_SHRINK = 0.14; // scale goes 1 -> 0.86
const SLOW_MS = 24; // average frame time that counts as "can't keep up"
const WARMUP_S = 1;
const WINDOW = 60; // frames per measurement
const COLOR = "#FF6A3D";

interface SceneProps {
  /** First frames are on screen: crossfade from the poster. */
  onReady: () => void;
  /** The device can't keep up (or lost its GPU context): remove the canvas for good. */
  onGiveUp: () => void;
}

interface Inputs {
  /** Pointer across the viewport, -1..1. */
  pointer: { x: number; y: number };
  /** Hero scroll progress, 0..1. */
  scroll: number;
  /** Intro rotation offset, tweened by GSAP from -PI/2 to 0. */
  intro: { o: number };
  tilt: boolean;
}

interface MarkProps {
  inputs: React.RefObject<Inputs>;
  onReady: () => void;
  onSlow: (step: 1 | 2) => void;
}

function Mark({ inputs, onReady, onSlow }: MarkProps) {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => buildMarkGeometry(), []);
  const state = useRef({
    spin: 0,
    tx: 0,
    ty: 0,
    frames: 0,
    ready: false,
    elapsed: 0,
    n: 0,
    sum: 0,
    step: 0 as 0 | 1 | 2,
    done: false,
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const intro = inputs.current.intro;
    return () => {
      gsap.killTweensOf(intro);
    };
  }, [inputs]);

  useFrame((_, delta) => {
    const m = mesh.current;
    const s = state.current;
    const i = inputs.current;
    if (!m) return;

    // Resuming after the loop was paused (hidden tab, off-screen) gives one huge delta: ignore it.
    if (delta > 0.2) return;
    const dt = Math.min(delta, 0.05);

    s.spin += (dt * Math.PI) / 2 / SPIN_PERIOD;
    const k = 1 - Math.exp(-dt * DAMP);
    s.tx += ((i.tilt ? i.pointer.y * TILT_X : 0) - s.tx) * k;
    s.ty += ((i.tilt ? i.pointer.x * TILT_Y : 0) - s.ty) * k;

    m.rotation.set(s.tx, s.ty, s.spin + i.scroll * SCROLL_TURN + i.intro.o);
    const scale = 1 - SCROLL_SHRINK * i.scroll;
    // Negative Y: the geometry is in SVG orientation (y down). three flips the winding for us.
    m.scale.set(scale, -scale, scale);

    // First two frames drawn: hand over from the poster and start the intro turn.
    if (!s.ready) {
      s.frames += 1;
      if (s.frames >= 2) {
        s.ready = true;
        onReady();
        gsap.fromTo(i.intro, { o: -Math.PI / 2 }, { o: 0, duration: 1.4, ease: "sleekSpring" });
      }
      return;
    }

    // ── Frame-time guard (once per page view, never re-upgrades) ──
    if (s.done) return;
    s.elapsed += dt;
    if (s.elapsed < WARMUP_S) return;
    s.n += 1;
    s.sum += delta * 1000;
    if (s.n < WINDOW) return;
    const average = s.sum / s.n;
    s.n = 0;
    s.sum = 0;
    if (average <= SLOW_MS) {
      s.done = true;
    } else if (s.step === 0) {
      s.step = 1;
      onSlow(1);
    } else {
      s.done = true;
      s.step = 2;
      onSlow(2);
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry} scale={[1, -1, 1]}>
      <meshStandardMaterial color={COLOR} roughness={0.38} metalness={0.12} />
    </mesh>
  );
}

/** Gives up on GPU context loss instead of trying to restore it. */
function ContextWatch({ onLost }: { onLost: () => void }) {
  const gl = useThree((t) => t.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const handle = (e: Event) => {
      e.preventDefault();
      onLost();
    };
    canvas.addEventListener("webglcontextlost", handle);
    // Removed before R3F force-loses the context on unmount, so a normal unmount never reports a loss.
    return () => canvas.removeEventListener("webglcontextlost", handle);
  }, [gl, onLost]);
  return null;
}

export default function HeroMarkCanvas({ onReady, onGiveUp }: SceneProps) {
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.5]);

  const inputs = useRef<Inputs>({ pointer: { x: 0, y: 0 }, scroll: 0, intro: { o: -Math.PI / 2 }, tilt: true });

  // Pointer, scroll and visibility feed refs. R3F never raycasts: no mesh has handlers.
  useEffect(() => {
    const el = box.current;
    if (!el) return;

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      inputs.current.pointer = {
        x: clamp(-1, 1, (e.clientX / window.innerWidth) * 2 - 1),
        y: clamp(-1, 1, (e.clientY / window.innerHeight) * 2 - 1),
      };
    };

    const hero = document.getElementById("home");
    let heroHeight = hero?.offsetHeight || window.innerHeight;
    let frame = 0;
    const readScroll = () => {
      frame = 0;
      inputs.current.scroll = clamp(0, 1, window.scrollY / heroHeight);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(readScroll);
    };
    // The hero height is cached, so no layout is forced from the scroll handler.
    const onResize = () => {
      heroHeight = hero?.offsetHeight || window.innerHeight;
      onScroll();
    };
    readScroll();

    let inView = true;
    let tabVisible = !document.hidden;
    const sync = () => setVisible(inView && tabVisible);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    const onVisibility = () => {
      tabVisible = !document.hidden;
      sync();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const onSlow = (step: 1 | 2) => {
    if (step === 1) {
      // Step 1: lighter. Pixel ratio 1 and no pointer tilt (spin only).
      inputs.current.tilt = false;
      setDpr([1, 1]);
    } else {
      onGiveUp();
    }
  };

  return (
    <div ref={box} className="size-full">
      <Canvas
        camera={{ fov: 35, position: [0, 0, 5], near: 0.1, far: 20 }}
        dpr={dpr}
        frameloop={visible ? "always" : "never"}
        gl={{ alpha: true, antialias: true, powerPreference: "low-power", stencil: false, depth: true }}
        style={{ pointerEvents: "none" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2.5, 3, 4]} intensity={2.4} color="#ffffff" />
        <directionalLight position={[-3, 1, -2]} intensity={1.1} color="#ff9a7a" />
        <Mark inputs={inputs} onReady={onReady} onSlow={onSlow} />
        <ContextWatch onLost={onGiveUp} />
      </Canvas>
    </div>
  );
}
