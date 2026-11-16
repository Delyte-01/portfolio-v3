import { Blocks, Database, Sparkles, Wrench, type LucideIcon } from "lucide-react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { skillGroups } from "@/lib/data/profile";
import { cn } from "@/lib/utils";

/**
 * One card per kind of work, each with its own icon and a one-line purpose, so the grid reads as
 * "what I use it for" rather than four lookalike boxes. Same language as the About fact cards:
 * hard ink border + offset shadow, a slight tilt that straightens on hover, and a lift.
 */
const GROUPS: Record<string, { icon: LucideIcon; card: string; badge: string; chip: string; tilt: string }> = {
  Frontend: {
    icon: Blocks,
    card: "bg-white text-ink",
    badge: "bg-[#D72B0C] text-white",
    chip: "border-ink/25 hover:border-ink hover:bg-ink hover:text-white",
    tilt: "md:-rotate-1",
  },
  "Motion & interaction": {
    icon: Sparkles,
    card: "bg-ink text-white",
    badge: "bg-white text-ink",
    chip: "border-white/25 hover:border-[#FF6A3D] hover:bg-[#FF6A3D] hover:text-ink",
    tilt: "md:rotate-1",
  },
  "Data & APIs": {
    icon: Database,
    card: "bg-[#FFE9E1] text-ink",
    badge: "bg-ink text-white",
    chip: "border-ink/25 hover:border-ink hover:bg-ink hover:text-white",
    tilt: "md:rotate-[1.5deg]",
  },
  "Tools & workflow": {
    icon: Wrench,
    card: "bg-[#FFC9B5] text-ink",
    badge: "bg-white text-ink",
    chip: "border-ink/30 hover:border-ink hover:bg-ink hover:text-white",
    tilt: "md:rotate-[-1.5deg]",
  },
};

/** Typography-led technology showcase on the blended orange section. No bars, no percentages. */
export default function Expertise() {
  return (
    <Section id="expertise" data-section="about" tone="dark" grid glow className="section-grain" aria-labelledby="expertise-heading">
      <header className="mb-14 grid gap-6 md:mb-16 md:grid-cols-12 md:items-end md:gap-x-8">
        <div className="md:col-span-8">
          <Eyebrow index="03" className="mb-6">
            Expertise
          </Eyebrow>
          <h2 id="expertise-heading" className="t-headline">
            Tools I <span className="accent-text">work with.</span>
          </h2>
        </div>
        <p className="t-body text-muted-foreground md:col-span-4">
          The stack behind the projects above, grouped by what it&apos;s used for.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {skillGroups.map((group, gi) => {
          const g = GROUPS[group.title] ?? GROUPS.Frontend;
          const Icon = g.icon;
          return (
            <div
              key={group.title}
              data-reveal="fade"
              data-skill-card=""
              className={cn(
                "group/skill flex flex-col gap-6 rounded-2xl border-2 border-ink p-6 shadow-[5px_5px_0_0_var(--ink)] md:p-7",
                "transition-[rotate,translate,box-shadow] duration-500 ease-[var(--ease-atelier)]",
                "hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[10px_10px_0_0_var(--ink)] focus-within:rotate-0",
                g.card,
                g.tilt,
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <span
                  aria-hidden
                  data-skill-badge=""
                  className={cn(
                    "skill-badge grid size-12 place-items-center rounded-xl border-2 border-ink transition-transform duration-500 ease-[var(--ease-atelier)] group-hover/skill:-rotate-6 group-hover/skill:scale-110",
                    g.badge,
                  )}
                >
                  <Icon strokeWidth={1.75} className="size-6" />
                </span>
                <span className="t-meta opacity-70">0{gi + 1}</span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-2xl leading-none">{group.title}</h3>
                <p className="mt-2 text-sm leading-snug opacity-75">{group.blurb}</p>
              </div>

              <div className="mt-auto flex flex-col gap-4">
                <ul className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      data-chip=""
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm tracking-tight transition-colors duration-300",
                        g.chip,
                      )}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="t-meta tabular-nums opacity-70">
                  <span data-count-to={group.items.length}>{group.items.length}</span> tools
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
