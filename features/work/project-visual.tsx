import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/data/projects";

const TONES: Record<Project["tone"], { bg: string; fg: string; accent: string; dot: string }> = {
  ivory: { bg: "bg-[#F6F6F6]", fg: "text-ink", accent: "var(--electric)", dot: "var(--ink)" },
  charcoal: { bg: "bg-charcoal", fg: "text-ivory", accent: "#FFFFFF", dot: "var(--ink)" },
  electric: { bg: "bg-ink", fg: "text-white", accent: "var(--electric)", dot: "#FFFFFF" },
  pink: { bg: "bg-[#FFE8E1]", fg: "text-ink", accent: "var(--electric)", dot: "var(--ink)" },
};

/** Generated placeholder for projects that have no screenshot yet. */
function Placeholder({ project }: { project: Project }) {
  const t = TONES[project.tone];
  return (
    <div className={cn("absolute inset-0 overflow-hidden", t.bg, t.fg)}>
      <div aria-hidden className="bg-grid absolute inset-0 opacity-60" />
      <svg aria-hidden viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <circle cx="270" cy="150" r="90" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
        <path d="M270 60 A90 90 0 0 1 360 150 L270 150 Z" fill={t.accent} />
        <rect x="70" y="150" width="90" height="90" fill="currentColor" opacity="0.9" />
        <circle cx="115" cy="195" r="12" fill={t.dot} />
      </svg>
      <p className="t-meta absolute bottom-5 left-5">
        {project.mock ? "Concept" : "Preview"} — {project.title}
      </p>
    </div>
  );
}

const POP = ["var(--electric)", "var(--ink)", "var(--electric)", "var(--ink)", "var(--electric)"] as const;

/** "delyte-academy.vercel.app" for the browser bar; the slug when there is no live site. */
function hostLabel(project: Project): string {
  if (!project.live) return project.slug;
  try {
    return new URL(project.live).hostname.replace(/^www\./, "");
  } catch {
    return project.slug;
  }
}

interface ProjectVisualProps {
  /** Show the "View" sticker on hover (cards only). */
  badge?: boolean;
  project: Project;
  /** Tailwind aspect utility, e.g. `aspect-[16/9]`. */
  aspect: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function ProjectVisual({ project, aspect, sizes, priority, badge, className }: ProjectVisualProps) {
  const pop = POP[(Math.max(parseInt(project.index, 10), 1) - 1) % POP.length];

  const reveal = (
    <div data-reveal="clip" className={cn("relative w-full overflow-hidden rounded-[0.875rem] bg-muted", aspect)}>
      {project.image ? (
        // Hover zoom lives on this wrapper (CSS `scale`) so it never competes with
        // the GSAP reveal/parallax transform that runs on the <img> itself.
        // On cards from 1024 px up the screenshot sits below the browser bar (lg:top-7). `data-screen` is what
        // the desktop tilt moves against the card for a little depth (components/motion/micro/work-cards.ts).
        <div
          data-screen=""
          className={cn(
            "absolute inset-0 transition-[scale] duration-[900ms] ease-[var(--ease-atelier)] group-hover/project:scale-[1.04]",
            badge && "lg:top-7",
          )}
        >
          <Image
            src={project.image}
            alt={`${project.title} website preview`}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover object-top"
          />
        </div>
      ) : (
        <Placeholder project={project} />
      )}
      {badge ? (
        // Device chrome (3d-model-animation.md section 6.1): static CSS only, from 1024 px up. Below that the
        // card is exactly as before. It overlays the top strip of the box, so the aspect ratio never changes.
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 hidden h-7 items-center gap-1.5 bg-ink/90 px-3 lg:flex"
        >
          <span className="size-1.5 rounded-full bg-white/40" />
          <span className="size-1.5 rounded-full bg-white/40" />
          <span className="size-1.5 rounded-full bg-white/40" />
          <span className="t-meta ml-2 min-w-0 truncate rounded-full bg-white/10 px-2.5 py-0.5 normal-case text-white/70">
            {hostLabel(project)}
          </span>
        </div>
      ) : null}
      {badge ? (
        // Touch and tablet fallback. On desktop with a mouse the custom cursor shows "View" instead
        // (see .view-sticker in globals.css, which uses the same media query as the cursor).
        <span
          aria-hidden
          className="view-sticker t-meta absolute bottom-4 right-4 grid size-16 scale-75 place-items-center rounded-full border-2 border-ink bg-electric text-white opacity-0 transition-[opacity,transform] duration-500 ease-[var(--ease-atelier)] group-hover/project:scale-100 group-hover/project:opacity-100"
        >
          View
        </span>
      ) : null}
    </div>
  );

  if (!badge) {
    // Case-study hero: the offset shadow lives on this outer frame so the clip-path reveal on the
    // inner box can't cut it off.
    return (
      <div
        style={{ "--pop": pop } as React.CSSProperties}
        className={cn(
          "rounded-2xl border-2 border-foreground bg-card shadow-[8px_8px_0_0_var(--pop)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-atelier)]",
          "group-hover/project:-translate-x-1 group-hover/project:-translate-y-1 group-hover/project:shadow-[14px_14px_0_0_var(--pop)]",
          className,
        )}
      >
        {reveal}
      </div>
    );
  }

  // Cards: the hard shadow is its own layer, so the frame can tilt (data-tilt) while the shadow
  // slides the other way (data-tilt-shadow) and a soft highlight follows the pointer (data-shine).
  // Both layers use the CSS `translate` property for the hover lift; GSAP only writes `transform`,
  // so the two add up instead of fighting. Without JS (or on touch) the card looks as before.
  return (
    <div style={{ "--pop": pop } as React.CSSProperties} className={cn("relative", className)}>
      <span
        aria-hidden
        data-tilt-shadow=""
        className={cn(
          "pointer-events-none absolute inset-0 translate-x-2 translate-y-2 rounded-2xl bg-[var(--pop)]",
          "transition-[translate] duration-500 ease-[var(--ease-atelier)]",
          "group-hover/project:translate-x-[10px] group-hover/project:translate-y-[10px]",
        )}
      />
      <div
        data-tilt=""
        data-cursor="view"
        className={cn(
          "relative rounded-2xl border-2 border-foreground bg-card transition-[translate] duration-500 ease-[var(--ease-atelier)]",
          "group-hover/project:-translate-x-1 group-hover/project:-translate-y-1",
        )}
      >
        {reveal}
        <span
          aria-hidden
          data-shine=""
          className="pointer-events-none absolute inset-0 rounded-[0.875rem] opacity-0"
          style={{
            background:
              "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgb(255 255 255 / .22), transparent 55%)",
          }}
        />
      </div>
    </div>
  );
}
