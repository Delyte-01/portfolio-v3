import { ArrowUpRight } from "lucide-react";
import { LogoIcon } from "@/components/brand/logo";
import { CtaButton } from "@/components/ui/cta-button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { StatusDot } from "@/components/ui/status-dot";
import { mailHref, site, whatsappHref } from "@/lib/site";
import { CopyEmail } from "./copy-email";

const LINKS = [
  { label: "WhatsApp", href: whatsappHref },
  { label: "GitHub", href: site.socials.github },
  { label: "LinkedIn", href: site.socials.linkedin },
] as const;

/** Black section with a single orange contact card (gradient border, glow ring, offset ghost card). */
export default function Contact() {
  return (
    <Section id="contact" tone="ink" aria-labelledby="contact-heading">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-16">
        <div className="lg:col-span-7">
          <Eyebrow index="05" className="mb-6">
            Contact
          </Eyebrow>
          <h2 id="contact-heading" className="t-display max-w-[13ch]">
            Have something <span className="accent-text">interesting</span> in mind?
          </h2>
          <p className="t-meta mt-8 flex items-center gap-2 text-muted-foreground">
            <StatusDot />
            {site.availability}
          </p>
        </div>

        <div data-contact-card className="relative lg:col-span-5">
          {/* Depth layers behind the card: hatched offset card + soft glow ring. */}
          <div aria-hidden data-contact-ghost className="contact-ghost" />
          <div aria-hidden data-contact-halo className="contact-halo" />

          <div data-contact-surface className="contact-card p-6 text-white sm:p-8 md:p-10">
            <div aria-hidden data-contact-mark className="pointer-events-none absolute -bottom-12 -right-12">
              <LogoIcon mono className="animate-spin-slow size-56 text-white/[0.09] md:size-64" />
            </div>
            <div aria-hidden data-contact-sheen className="contact-sheen" />
            <div aria-hidden data-contact-glow className="contact-glow" />

            <div className="relative">
              <p data-contact-item className="t-meta mb-3 text-white/80">
                Say hello
              </p>
              <a
                data-contact-item
                data-split-hover=""
                data-magnetic="0.08"
                href={mailHref}
                className="email-link block break-all font-heading text-[clamp(1.25rem,2.2vw,1.75rem)] font-bold leading-tight underline decoration-white/60 decoration-2 underline-offset-[0.25em] transition-colors duration-300 hover:decoration-white sm:break-normal"
              >
                {site.email}
              </a>

              <div data-contact-item className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <CtaButton href={mailHref} variant="solid" className="w-full sm:w-auto">
                  Start a conversation
                </CtaButton>
                <CopyEmail email={site.email} className="w-full sm:w-auto" />
              </div>

              <ul className="mt-10 flex flex-col border-t border-white/30">
                {LINKS.map((l) => (
                  <li key={l.label} data-contact-item className="border-b border-white/30">
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/link flex min-h-14 items-center justify-between px-1 text-base font-semibold transition-colors duration-300 hover:bg-black/15"
                    >
                      {l.label}
                      <ArrowUpRight
                        aria-hidden
                        strokeWidth={1.75}
                        className="size-5 transition-transform duration-300 ease-[var(--ease-atelier)] group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
