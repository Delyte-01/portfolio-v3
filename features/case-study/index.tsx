import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { getAdjacentProjects, type Project } from "@/lib/data/projects";
import { ProjectVisual } from "@/features/work/project-visual";
import { TechList } from "@/features/work/project-card";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div data-reveal="fade" className="grid gap-4 border-t border-hairline py-10 md:grid-cols-12 md:gap-8">
      <h2 className="t-meta text-muted-ink md:col-span-3">{label}</h2>
      <div className="md:col-span-9">{children}</div>
    </div>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <p className="t-body max-w-[62ch] text-ink/85">{children}</p>;
}

export default function CaseStudy({ project }: { project: Project }) {
  const { caseStudy: cs } = project;
  const { prev, next } = getAdjacentProjects(project.slug);
  const hasDetail = Boolean(cs.overview || cs.challenge || cs.role || cs.approach?.length || cs.features?.length);

  return (
    <>
      <main id="main">
        <Section id="case-intro" flush className="pb-12 pt-28 md:pb-16 md:pt-36">
          <Link
            href="/#work"
            className="t-meta mb-10 inline-flex min-h-11 items-center gap-2 text-muted-ink transition-colors duration-300 hover:text-electric-ink"
          >
            <ArrowLeft aria-hidden strokeWidth={1.5} className="size-4" />
            All work
          </Link>

          <Eyebrow index={project.index} className="mb-6">
            Case study
          </Eyebrow>
          <h1 className="t-display break-words text-[clamp(2.5rem,7vw,6.5rem)] text-ink">
            {project.title}
          </h1>
          <p className="t-body mt-6 max-w-[56ch] text-muted-ink">
            {project.summary}
          </p>

          {project.mock ? (
            <p className="t-meta mt-8 inline-block border border-pink px-3 py-2 text-ink">
              Concept project — screenshots and details are illustrative
            </p>
          ) : null}

          <dl data-reveal="fade" className="mt-12 grid grid-cols-2 gap-6 border-t border-hairline pt-6 md:grid-cols-4">
            <div>
              <dt className="t-meta mb-2 text-muted-ink">Category</dt>
              <dd className="text-sm text-ink">{project.category}</dd>
            </div>
            {project.year ? (
              <div>
                <dt className="t-meta mb-2 text-muted-ink">Year</dt>
                <dd className="text-sm text-ink">{project.year}</dd>
              </div>
            ) : null}
            <div className="col-span-2">
              <dt className="t-meta mb-2 text-muted-ink">Stack</dt>
              <dd>
                <TechList items={project.tech} />
              </dd>
            </div>
          </dl>
        </Section>

        <Container className="pb-20 md:pb-28">
          <ProjectVisual project={project} aspect="aspect-[16/10]" sizes="(min-width: 1440px) 1360px, 92vw" priority />
        </Container>

        <Section id="case-detail" flush className="pb-24 md:pb-32">
          {hasDetail ? (
            <>
              {cs.overview ? (
                <DetailRow label="Overview">
                  <Prose>{cs.overview}</Prose>
                </DetailRow>
              ) : null}
              {cs.challenge ? (
                <DetailRow label="Challenge">
                  <Prose>{cs.challenge}</Prose>
                </DetailRow>
              ) : null}
              {cs.role ? (
                <DetailRow label="My role">
                  <Prose>{cs.role}</Prose>
                </DetailRow>
              ) : null}
              {cs.approach?.length ? (
                <DetailRow label="Approach">
                  <ul className="flex max-w-[62ch] flex-col gap-4">
                    {cs.approach.map((a) => (
                      <li key={a} className="t-body relative pl-5 text-ink/85 before:absolute before:left-0 before:top-[0.85em] before:h-px before:w-3 before:bg-pink">
                        {a}
                      </li>
                    ))}
                  </ul>
                </DetailRow>
              ) : null}
              {cs.features?.length ? (
                <DetailRow label="Features">
                  <ul className="flex max-w-[62ch] flex-col gap-4">
                    {cs.features.map((f) => (
                      <li key={f} className="t-body relative pl-5 text-ink/85 before:absolute before:left-0 before:top-[0.85em] before:h-px before:w-3 before:bg-pink">
                        {f}
                      </li>
                    ))}
                  </ul>
                </DetailRow>
              ) : null}
            </>
          ) : (
            <div className="border-t border-hairline pt-10">
              <Prose>A fuller write-up for this project is coming soon. In the meantime, you can explore the live site or the source.</Prose>
            </div>
          )}

          {project.live || project.github ? (
            <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-hairline pt-10">
              {project.live ? (
                <CtaButton href={project.live} external variant="accent">
                  Visit live project
                </CtaButton>
              ) : null}
              {project.github ? (
                <ArrowLink href={project.github} external>
                  View source on GitHub
                </ArrowLink>
              ) : null}
            </div>
          ) : null}
        </Section>

        <Section id="case-next" data-section="work" tone="dark" grid flush className="py-16 md:py-24" aria-label="More projects">
          <div className="grid gap-px border border-border md:grid-cols-2">
            {prev ? <AdjacentLink project={prev} direction="prev" /> : null}
            {next ? <AdjacentLink project={next} direction="next" /> : null}
          </div>
        </Section>
      </main>
    </>
  );
}

function AdjacentLink({ project, direction }: { project: Project; direction: "prev" | "next" }) {
  const isNext = direction === "next";
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group/adj flex min-h-48 flex-col justify-between gap-10 p-6 transition-colors duration-300 hover:bg-white/[0.04] md:p-10"
    >
      <span className={`t-meta flex items-center gap-2 text-muted-foreground ${isNext ? "md:justify-end" : ""}`}>
        {!isNext && <ArrowLeft aria-hidden strokeWidth={1.5} className="size-4" />}
        {isNext ? "Next project" : "Previous project"}
        {isNext && <ArrowRight aria-hidden strokeWidth={1.5} className="size-4 transition-transform duration-300 group-hover/adj:translate-x-1" />}
      </span>
      <span className={`font-heading font-bold text-[clamp(2rem,4vw,3.5rem)] leading-none ${isNext ? "md:text-right" : ""}`}>
        {project.title}
      </span>
    </Link>
  );
}
