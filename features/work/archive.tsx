import Link from "next/link";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import type { Project } from "@/lib/data/projects";
import { ArchivePreview } from "./archive-preview";

/**
 * Compact index of the remaining projects, shown on the dark section.
 * On desktop with a mouse, hovering a row shows that project's screenshot (see archive-preview.tsx).
 */
export function Archive({ projects }: { projects: readonly Project[] }) {
  return (
    <div data-archive className="mt-20 md:mt-28">
      <Eyebrow index="+" className="mb-6">
        More work
      </Eyebrow>
      <ul className="group/list border-t border-border">
        {projects.map((p) => (
          <li
            key={p.slug}
            data-reveal="fade"
            data-archive-row=""
            data-slug={p.slug}
            className="group/row grid grid-cols-[auto_1fr] items-baseline gap-x-6 gap-y-2 border-b border-border px-2 py-7 transition-[background-color,opacity] duration-300 hover:bg-white/[0.07] md:group-hover/list:opacity-55 md:hover:opacity-100! md:grid-cols-12 md:items-center md:gap-x-8 md:px-4"
          >
            <span className="t-meta text-pink-ink md:col-span-1">{p.index}</span>
            <h3 className="font-heading font-bold text-3xl leading-none md:col-span-4 md:text-4xl">
              <Link
                href={`/work/${p.slug}`}
                className="inline-block transition-transform duration-500 ease-[var(--ease-atelier)] group-hover/row:translate-x-2"
              >
                {p.title}
              </Link>
            </h3>
            <p className="t-meta col-start-2 text-muted-foreground md:col-span-5 md:col-start-auto lg:col-span-3">
              {p.category}
            </p>
            <p className="t-meta col-start-2 hidden text-muted-foreground lg:col-span-2 lg:block">
              {p.tech.slice(0, 3).join(" · ")}
            </p>
            <div className="col-start-2 mt-2 flex gap-5 md:col-span-2 md:col-start-auto md:mt-0 md:justify-end">
              {p.live ? (
                <ArrowLink href={p.live} external>
                  Live<span className="sr-only">: {p.title}</span>
                </ArrowLink>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <ArchivePreview projects={projects} />
    </div>
  );
}
