import { ExtrudeGeometry, type BufferGeometry } from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { ICON, LOGO_BOX } from "@/components/brand/logo-parts";

/**
 * Builds the 3D hero mark from the existing logo paths (spec: 3d-model-animation.md section 5.3).
 * No model file: the 8 petals in `ICON` are parsed as SVG, extruded with a small bevel and
 * merged into ONE geometry, so the whole mark is one mesh and one draw call.
 *
 * Orientation: the geometry stays in SVG orientation (y points down). The mesh that uses it is
 * scaled by -1 on Y (see hero-mark-canvas.tsx); three flips the face winding for negative scales, so
 * the faces stay correct. Baking a Y flip into the vertices instead would turn every face inside out.
 *
 * Size: centred on the origin and scaled so the icon is exactly TARGET_HEIGHT world units tall.
 */

const TARGET_HEIGHT = 2;
const DEPTH = 26; // logo units (the icon is 217.6 tall)
const TRIANGLE_BUDGET = 12_000;

function extrude(curveSegments: number): BufferGeometry {
  const { x, y, w, h } = LOGO_BOX.icon;
  const paths = ICON.map((p) => `<path d="${p.d}" transform="${p.m}"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${w} ${h}">${paths}</svg>`;

  const parts: BufferGeometry[] = [];
  for (const path of new SVGLoader().parse(svg).paths) {
    const shapes = SVGLoader.createShapes(path);
    if (!shapes.length) continue;
    parts.push(
      new ExtrudeGeometry(shapes, {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: 3,
        bevelSize: 2.5,
        bevelSegments: 2,
        curveSegments,
      }),
    );
  }

  const merged = mergeGeometries(parts, false);
  parts.forEach((g) => g.dispose());
  if (!merged) throw new Error("mark-geometry: could not merge the icon petals");
  return merged;
}

/** The caller owns the returned geometry and must dispose it. */
export function buildMarkGeometry(): BufferGeometry {
  let geometry = extrude(8);

  // Stay inside the triangle budget: fewer curve segments if the paths turned out more detailed than expected.
  if (geometry.getAttribute("position").count / 3 > TRIANGLE_BUDGET) {
    geometry.dispose();
    geometry = extrude(5);
  }

  geometry.center();
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (box) {
    const k = TARGET_HEIGHT / (box.max.y - box.min.y);
    geometry.scale(k, k, k);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[hero-mark] ${geometry.getAttribute("position").count / 3} triangles`);
  }
  return geometry;
}
