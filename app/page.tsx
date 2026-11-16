import About from "@/features/about";
import Contact from "@/features/contact";
import Experience from "@/features/experience";
import Expertise from "@/features/expertise";
import Hero from "@/features/hero";
import Work from "@/features/work";
import { site } from "@/lib/site";
import { DesktopMotion } from "@/components/motion/desktop-motion";
import { PageMotion } from "@/components/motion/page-motion";
import { Marquee } from "@/components/ui/marquee";

const STACK = ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP", "Lenis", "Supabase", "Figma"] as const;
const PRINCIPLES = ["Mobile-first", "Accessible", "Fast by default", "Motion with purpose", "Pixel-considered"] as const;

/** Accurate, minimal structured data: only facts already shown on the site. */
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.fullName,
  alternateName: site.name,
  jobTitle: "Frontend Developer",
  url: site.url,
  email: `mailto:${site.email}`,
  address: { "@type": "PostalAddress", addressLocality: "Lagos", addressCountry: "NG" },
  sameAs: [site.socials.github, site.socials.linkedin],
};

/** Delyte V3 homepage. */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
      <main id="main">
        <Hero />
        <div aria-hidden className="relative overflow-hidden py-14 md:py-20">
          <Marquee
            items={STACK}
            duration={38}
            className="-ml-[5%] w-[110%] -rotate-2 border-y-2 border-ink bg-electric py-4 text-white"
            itemClassName="font-heading font-bold text-3xl md:text-5xl"
          />
          <Marquee
            items={PRINCIPLES}
            duration={46}
            reverse
            className="-ml-[5%] -mt-6 w-[110%] rotate-[1.5deg] border-y-2 border-ink bg-ink py-4 text-white md:-mt-8"
            itemClassName="font-heading font-bold text-3xl md:text-5xl"
            separator="●"
          />
        </div>
        <Work />
        <About />
        <Expertise />
        <Experience />
        <div aria-hidden className="relative overflow-hidden bg-ivory py-12 md:py-16">
          <Marquee
            items={["Let’s build something together", "Say hello", "Open for projects"]}
            duration={50}
            className="-ml-[5%] w-[110%] -rotate-1 border-y-2 border-ink bg-electric py-5 text-white"
            itemClassName="font-heading font-bold text-4xl md:text-7xl"
          />
        </div>
        <Contact />
      </main>
      <PageMotion />
      {/* After PageMotion: reads the DOM once its hidden start states are in place. */}
      <DesktopMotion />
    </>
  );
}
