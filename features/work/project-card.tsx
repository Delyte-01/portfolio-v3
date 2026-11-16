import Link from "next/link";
import { ArrowLink } from "@/components/ui/arrow-link";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/data/projects";
import { ProjectVisual } from "./project-visual";

export type CardLayout = "wide" | "tall" | "landscape" | "reverse";

const LAYOUT: Record<CardLayout, { aspect: string; sizes: string }> = {
  wide: { aspect: "aspect-[16/9]", sizes: "(min-width: 1440px) 1360px, 92vw" },
  landscape: { aspect: "aspect-[4/3]", sizes: "(min-width: 1024px) 58vw, 92vw" },
  tall: { aspect: "aspect-[4/5]", sizes: "(min-width: 1024px) 38vw, 92vw" },
  reverse: { aspect: "aspect-[3/2]", sizes: "(min-width: 1024px) 62vw, 92vw" },
};

const CHIP_TONES = [
  "border-electric/30 bg-electric/10 text-electric-ink",
  "border-ink/20 bg-ink/5 text-ink",
  "border-electric/30 bg-electric/10 text-electric-ink",
  "border-ink/20 bg-ink/5 text-ink",
  "border-electric/30 bg-electric/10 text-electric-ink",
] as const;

export function TechList({ items, className }: { items: readonly string[]; className?: string }) {
  return (
    <ul data-tech="" className={cn("flex flex-wrap gap-1.5", className)} aria-label="Technologies">
      {items.map((t, i) => (
        <li key={t} className={cn("t-meta rounded-full border px-3 py-1.5", CHIP_TONES[i % CHIP_TONES.length])}>
          {t}
        </li>
      ))}
    </ul>
  );
}

interface ProjectCardProps {
  project: Project;
  layout: CardLayout;
  priority?: boolean;
  className?: string;
}

export function ProjectCard({ project, layout, priority, className }: ProjectCardProps) {
  const { aspect, sizes } = LAYOUT[layout];
  const href = `/work/${project.slug}`;
  const compact = layout === "tall" || layout === "landscape";

  return (
    <article data-project className={cn("group/project", className)}>
      <Link
        href={href}
        aria-label={`${project.title} — view case study`}
        className="block"
        tabIndex={-1}
      >
        <ProjectVisual project={project} aspect={aspect} sizes={sizes} priority={priority} badge />
      </Link>

      <div
        className={cn(
          "mt-9 grid gap-5",
          compact ? "grid-cols-1" : "md:grid-cols-12 md:gap-x-8",
        )}
      >
        <p
          className={cn(
            "t-meta flex items-center gap-3 text-muted-foreground",
            !compact && "md:col-span-3",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background">
            {project.index}
          </span>
          {project.category}
          {project.year ? <span>· {project.year}</span> : null}
        </p>

        <div className={cn(!compact && "md:col-span-5")}>
          <h3 className="t-headline text-[clamp(2rem,3.6vw,3.25rem)]">
            <Link href={href} data-split-hover="" className="transition-colors duration-300 hover:text-electric">
              {project.title}
            </Link>
          </h3>
          <p className="t-body mt-3 max-w-[52ch] text-muted-foreground">{project.summary}</p>
        </div>

        <div className={cn("flex flex-col gap-5", !compact && "md:col-span-4 md:items-start")}>
          <TechList items={project.tech} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {project.live ? (
              <ArrowLink href={project.live} external>
                View project<span className="sr-only">: {project.title}</span>
              </ArrowLink>
            ) : null}
            <ArrowLink href={href}>
              View case study<span className="sr-only">: {project.title}</span>
            </ArrowLink>
          </div>
        </div>
      </div>
    </article>
  );
}
