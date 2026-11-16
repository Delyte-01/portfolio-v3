import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { education, experience } from "@/lib/data/profile";

export default function Experience() {
  return (
    <Section id="experience" data-section="about" aria-labelledby="experience-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-4">
          <div data-sticky-head="" className="lg:sticky lg:top-28">
            <Eyebrow index="04" className="mb-6">
              Experience
            </Eyebrow>
            <h2 id="experience-heading" className="t-headline text-ink">
              Where I&apos;ve <span className="accent-text">been building.</span>
            </h2>
          </div>
        </div>

        <div className="lg:col-span-8">
          {/* The line sits beside the list (not inside it) so the <ol> only ever contains <li>. Hidden
              until the desktop layer draws it (.timeline-line in globals.css). */}
          <div className="relative">
          <span aria-hidden data-timeline-line="" className="timeline-line absolute -left-px top-0 h-full w-[2px] origin-top bg-electric" />
          <ol className="relative border-l border-hairline pl-8 md:pl-12">
            {experience.map((job) => (
              <li key={job.org + job.role} data-reveal="fade" className="relative pb-14 last:pb-0">
                <span
                  aria-hidden
                  className="absolute -left-[calc(2rem+6.5px)] top-1.5 size-3 rounded-full bg-brand-gradient ring-4 ring-ivory md:-left-[calc(3rem+6.5px)]"
                />
                <span
                  aria-hidden
                  data-dot-pulse=""
                  className="pointer-events-none absolute -left-[calc(2rem+6.5px)] top-1.5 size-3 rounded-full border-2 border-electric opacity-0 md:-left-[calc(3rem+6.5px)]"
                />
                <div data-job="" className="rounded-2xl border-2 border-ink bg-surface-light p-6 shadow-[6px_6px_0_0_var(--hairline)] md:p-8">
                <p className="t-meta mb-4 flex flex-wrap items-center gap-2 text-muted-ink">
                  <span data-period="" className="rounded-full border border-hairline bg-muted px-3 py-1 tabular-nums">{job.period}</span>
                  {job.current ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-electric px-3 py-1 text-white">
                      <span aria-hidden className="size-1.5 rounded-full bg-white" />
                      Now
                    </span>
                  ) : null}
                </p>
                <h3 className="font-heading font-bold text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.05] text-ink">{job.role}</h3>
                <p className="mt-2 text-muted-ink">{job.org}</p>
                <ul className="t-body mt-6 flex max-w-[62ch] flex-col gap-3 text-ink/80">
                  {job.points.map((p) => (
                    <li key={p} className="relative pl-5 before:absolute before:left-0 before:top-[0.8em] before:h-px before:w-3 before:bg-pink">
                      {p}
                    </li>
                  ))}
                </ul>
                </div>
              </li>
            ))}
          </ol>
          </div>

          <div className="mt-16 border-t border-hairline pt-10">
            <h3 className="t-meta mb-6 text-muted-ink">Education &amp; training</h3>
            <ul>
              {education.map((e) => (
                <li
                  key={e.title}
                  data-reveal="fade"
                  className="grid gap-1 border-b border-hairline py-5 md:grid-cols-[1fr_1fr_auto] md:items-baseline md:gap-6"
                >
                  <span className="text-ink">{e.title}</span>
                  <span className="text-muted-ink">{e.issuer}</span>
                  <span className="t-meta text-muted-ink">{e.period}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
