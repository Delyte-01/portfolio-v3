import { ArrowLink } from "@/components/ui/arrow-link";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { site } from "@/lib/site";

const FACTS = [
  { label: "Experience", value: "2+ years in frontend" },
  { label: "Focus", value: "React, Next.js, TypeScript" },
  { label: "Based in", value: site.location },
  { label: "Working style", value: "Mobile-first, accessible" },
] as const;

const FACT_CARDS = [
  "bg-electric text-white md:-rotate-2",
  "bg-ink text-white md:rotate-1",
  "bg-muted text-ink ring-1 ring-ink/15 md:rotate-2",
  "bg-electric text-white md:-rotate-1",
] as const;

export default function About() {
  return (
    <Section id="about" glow aria-labelledby="about-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-4">
          <div data-sticky-head="" className="lg:sticky lg:top-28">
            <Eyebrow index="02" className="mb-6">
              About
            </Eyebrow>
            <h2 id="about-heading" className="t-headline text-ink">
              The details that make it <span className="accent-text">feel effortless.</span>
            </h2>
          </div>
        </div>

        <div className="lg:col-span-8">
          <blockquote data-reveal="fade" className="font-heading font-bold text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.15] tracking-tight text-ink">
            I care about the{" "}
            <mark className="marker">details that make digital experiences feel effortless</mark> — from the
            architecture behind an interface to the smallest interaction a user notices.
          </blockquote>

          <div className="t-body mt-12 grid gap-6 text-muted-ink md:grid-cols-2 md:gap-10">
            <p data-reveal="fade">
              I&apos;m a frontend developer with over two years of experience building responsive web
              applications with React and Next.js. I work between design and code, turning Figma
              handoffs into accessible, maintainable interfaces.
            </p>
            <p data-reveal="fade">
              I&apos;m drawn to interaction and motion, using GSAP and Lenis where they add clarity
              rather than noise. Most of my work starts mobile-first and keeps performance in view
              from the first component.
            </p>
            <p data-reveal="fade" className="md:col-span-2 md:max-w-[62ch]">
              I keep learning on purpose: frontend training at Tech 365, an internship with Stanix
              Consult, and day-to-day work on a Web3 platform and a school management system.
            </p>
          </div>

          <dl className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
            {FACTS.map((f, i) => (
              <div
                key={f.label}
                data-cursor="drag"
                className={`flex min-h-32 flex-col justify-between gap-5 rounded-2xl border-2 border-ink p-4 shadow-[4px_4px_0_0_var(--ink)] sm:min-h-36 sm:gap-6 sm:p-5 sm:shadow-[5px_5px_0_0_var(--ink)] transition-[translate,rotate] duration-500 ease-[var(--ease-atelier)] hover:rotate-0 hover:-translate-y-1 ${FACT_CARDS[i]}`}
              >
                <dt className="t-meta">{f.label}</dt>
                <dd className="font-heading font-bold text-[1.0625rem] leading-[1.15] [overflow-wrap:anywhere] sm:text-[1.375rem]">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10">
            <ArrowLink href={site.cv} external>
              Download CV
            </ArrowLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
