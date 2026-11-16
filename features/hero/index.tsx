import { CtaButton } from "@/components/ui/cta-button";
import { Container } from "@/components/ui/container";
import { SpinBadge } from "@/components/ui/spin-badge";
import { StatusDot } from "@/components/ui/status-dot";
import { mailHref, site } from "@/lib/site";
import { HeroFx } from "./hero-fx";
import { HeroMark } from "./hero-mark";
import { HeroStage } from "./hero-stage";
import { HeroSteps } from "./hero-steps";
import { LagosClock } from "./lagos-clock";

/** Headline words; each is wrapped in a mask so Phase 5 can reveal it. */
const HEADLINE: readonly { text: string; accent?: boolean; scribble?: boolean; rotate?: boolean }[] = [
  { text: "Building" },
  { text: "digital" },
  { text: "experiences," },
  { text: "thoughtfully", accent: true, scribble: true },
  { text: "engineered.", accent: true, rotate: true },
];

/** The last word rolls through these (desktop, motion allowed). The first entry is the real, static word. */
const ROTATE = ["engineered.", "designed.", "animated.", "performant."] as const;

export default function Hero() {
  return (
    <section
      id="home"
      data-section="home"
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[100svh] flex-col pt-24 md:pt-28"
    >
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 -z-20" />
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div aria-hidden data-hero-spot className="hero-spot pointer-events-none absolute inset-0 -z-10 hidden opacity-0 lg:block" />
      <HeroFx />

      <Container className="grid flex-1 items-center gap-12 pb-14 lg:grid-cols-12 lg:gap-12 lg:pb-16">
        <div className="lg:col-span-7">
          <p data-hero-label className="t-meta mb-8 flex items-center gap-3 text-muted-ink">
            <span aria-hidden className="h-0.5 w-8 rounded-full bg-pink" />
            {site.roleLabel}
          </p>

          <div data-depth="1">
            <h1 id="hero-heading" className="t-display text-[clamp(2.5rem,5.8vw,5.75rem)] text-ink">
              {HEADLINE.map((w) => {
                const word = (
                  <span className="inline-block overflow-hidden pb-[0.12em] pr-[0.08em] align-bottom">
                    <span data-hero-word className={w.accent ? "accent-text inline-block" : "inline-block"}>
                      {w.rotate ? (
                        <>
                          <span className="sr-only">{w.text}</span>
                          {/* All words stack in one grid cell, so the line never re-wraps when the word changes. */}
                          <span aria-hidden className="inline-grid">
                            <span data-rot data-words={ROTATE.join("|")} className="col-start-1 row-start-1">
                              {w.text}
                            </span>
                            {ROTATE.map((r) => (
                              <span key={r} className="invisible col-start-1 row-start-1 select-none">
                                {r}
                              </span>
                            ))}
                          </span>
                        </>
                      ) : (
                        w.text
                      )}
                    </span>
                  </span>
                );
                return (
                  <span key={w.text} data-hero-line-item className="relative mr-[0.14em] inline-block align-bottom">
                    {word}
                    {w.scribble && (
                      <svg
                        aria-hidden
                        data-hero-scribble
                        viewBox="0 0 300 16"
                        preserveAspectRatio="none"
                        className="pointer-events-none absolute -bottom-[0.04em] left-0 hidden h-[0.2em] w-full overflow-visible text-ink lg:block"
                      >
                        <path
                          d="M3 11 C 38 3, 64 14, 104 7 S 176 3, 214 9 S 270 12, 297 5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                    )}
                  </span>
                );
              })}
            </h1>
          </div>

          <div data-depth="0.6">
            <p data-hero-copy className="t-body mt-8 max-w-[46ch] text-muted-ink">
              I&apos;m a frontend developer focused on creating modern, intuitive and visually
              compelling digital experiences.
            </p>
          </div>

          <div data-hero-cta className="mt-10 flex flex-wrap items-center gap-3">
            <CtaButton href="/#work" variant="solid">
              Explore work
            </CtaButton>
            <CtaButton href={mailHref} variant="outline">
              Contact me
            </CtaButton>
          </div>

          <HeroSteps />
        </div>

        <div className="lg:col-span-5">
          <div data-hero-visual className="relative mx-auto w-full max-w-[460px] lg:ml-auto lg:max-w-none">
            <div data-depth="-1.6">
              <HeroStage className="h-auto w-full" />
              <SpinBadge id="hero-badge" text="Available for new projects" className="absolute -bottom-7 -left-2 size-28 bg-electric text-white lg:-left-10 lg:size-32" />
            </div>
            {/* 3D logo mark: static poster from 1024 px up, live WebGL only on capable desktops (3d-model-animation.md). */}
            <HeroMark />
          </div>
        </div>
      </Container>

      {/* Metadata strip */}
      <div className="border-t border-hairline bg-surface-light/70 backdrop-blur-sm">
        <Container>
          <dl data-hero-meta className="t-meta grid grid-cols-2 gap-x-6 gap-y-5 py-6 text-muted-ink md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <dt className="mb-1">Status</dt>
              <dd className="flex items-center gap-2 text-ink">
                <StatusDot />
                {site.availability}
              </dd>
            </div>
            <div>
              <dt className="mb-1">Based in</dt>
              <dd className="text-ink">
                {site.location}
                <LagosClock className="t-meta mt-1 hidden tabular-nums text-muted-ink lg:block" />
              </dd>
            </div>
            <div>
              <dt className="mb-1">Currently</dt>
              <dd className="text-ink">Lead Frontend, LiteUpper</dd>
            </div>
            <div className="hidden md:block">
              <dt className="mb-1">Scroll</dt>
              <dd className="text-ink">Selected work ↓</dd>
            </div>
          </dl>
        </Container>
      </div>
    </section>
  );
}
