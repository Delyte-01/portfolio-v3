import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { featuredProjects, projects } from "@/lib/data/projects";
import { ProjectCard } from "./project-card";
import { Archive } from "./archive";

export default function Work() {
  const [first, second, third, fourth] = featuredProjects;
  const archive = projects.filter((p) => !p.featured);

  return (
    <>
      <Section id="work" aria-labelledby="work-heading">
        <header className="mb-14 grid gap-6 md:mb-20 md:grid-cols-12 md:items-end md:gap-x-8">
          <div className="md:col-span-8">
            <Eyebrow index="01" className="mb-6">
              Selected Work
            </Eyebrow>
            <h2 id="work-heading" className="t-headline text-ink">
              Selected work, <span className="accent-text">carefully made.</span>
            </h2>
          </div>
          <p className="t-body text-muted-ink md:col-span-4">
            A few recent projects across education, commerce and product interfaces.
          </p>
        </header>

        <div className="flex flex-col gap-20 md:gap-28">
          {first && <ProjectCard project={first} layout="wide" priority />}

          <div className="grid gap-20 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0">
            {second && <ProjectCard project={second} layout="landscape" className="lg:col-span-7" />}
            {third && <ProjectCard project={third} layout="tall" className="lg:col-span-5 lg:mt-24" />}
          </div>
        </div>
      </Section>

      {/* z-10 keeps the floating hover preview above the sections that follow. */}
      <Section id="archive" data-section="work" tone="dark" grid glow className="section-grain z-10" aria-label="More work">
        {fourth && <ProjectCard project={fourth} layout="reverse" />}
        <Archive projects={archive} />
      </Section>
    </>
  );
}
