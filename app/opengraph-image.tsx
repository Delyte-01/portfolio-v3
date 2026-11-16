import { ImageResponse } from "next/og";
import { ICON, LETTERS, LOGO_BOX, LOGO_COLORS } from "@/components/brand/logo-parts";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFFFFF",
          color: "#0A0A0A",
          position: "relative",
          padding: 72,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 14,
            background: "#D72B0C",
          }}
        />
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#5C5C5C" }}>
          FRONTEND DEVELOPER / CREATIVE TECHNOLOGIST
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 120, lineHeight: 1, letterSpacing: -3 }}>
          <span>Building digital experiences,</span>
          <span style={{ color: "#D72B0C" }}>thoughtfully engineered.</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28 }}>
          <svg
            width={Math.round((88 * LOGO_BOX.full.w) / LOGO_BOX.full.h)}
            height={88}
            viewBox={`${LOGO_BOX.full.x} ${LOGO_BOX.full.y} ${LOGO_BOX.full.w} ${LOGO_BOX.full.h}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill={LOGO_COLORS.icon}>
              {ICON.map((p, i) => (
                <path key={i} d={p.d} transform={p.m} />
              ))}
            </g>
            <g fill={LOGO_COLORS.word}>
              {LETTERS.map((p, i) => (
                <path key={i} d={p.d} transform={p.m} />
              ))}
            </g>
          </svg>
          <span style={{ color: "#5C5C5C" }}>{site.location}</span>
        </div>
      </div>
    ),
    size,
  );
}
