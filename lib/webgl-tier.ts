import { DESKTOP_FINE } from "@/lib/motion";

/**
 * Decides whether this visitor gets the live 3D hero mark or only the static poster
 * (spec: 3d-model-animation.md section 3). Pure browser checks, no three import, so it is safe to
 * load in the main bundle. Call it only in the browser, after mount.
 *
 * "full"   desktop gate passes, WebGL2 works, enough memory / cores, no data saver or slow network.
 * "poster" everything else (the poster itself is only visible from 1024 px up, see globals.css).
 */
export type Tier3D = "poster" | "full";

interface NavigatorExtras {
  /** Approximate GB of RAM, capped at 8 by browsers. Chromium only. */
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

const SLOW_NETWORKS = new Set(["slow-2g", "2g", "3g"]);

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Hand the probe context straight back so it never counts against the page's context limit.
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function get3DTier(): Tier3D {
  if (typeof window === "undefined") return "poster";
  if (!window.matchMedia(DESKTOP_FINE).matches) return "poster";

  const nav = navigator as Navigator & NavigatorExtras;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 6) return "poster";
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency < 6) return "poster";
  if (nav.connection?.saveData) return "poster";
  if (nav.connection?.effectiveType && SLOW_NETWORKS.has(nav.connection.effectiveType)) return "poster";

  return hasWebGL2() ? "full" : "poster";
}
