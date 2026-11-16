/**
 * Project content.
 *
 * `mock: true` marks CONCEPT projects: realistic, believable copy that is still a draft.
 * Replace each concept entry's fields (and set `mock: false`) when the real details
 * are available. Concept entries are kept out of the sitemap and marked noindex.
 * Nothing here claims results, statistics, clients or testimonials.
 */

export interface CaseStudy {
  readonly overview?: string;
  readonly challenge?: string;
  readonly role?: string;
  readonly approach?: readonly string[];
  readonly features?: readonly string[];
}

export interface Project {
  readonly slug: string;
  readonly index: string;
  readonly title: string;
  readonly category: string;
  /** Only set where verified. */
  readonly year?: string;
  readonly summary: string;
  readonly tech: readonly string[];
  /** Remote screenshot URL (must be allowed in next.config images). */
  readonly image?: string;
  /** Accent used by the generated placeholder when there is no screenshot. */
  readonly tone: "ivory" | "charcoal" | "electric" | "pink";
  readonly live?: string;
  readonly github?: string;
  readonly featured: boolean;
  readonly mock: boolean;
  readonly caseStudy: CaseStudy;
}

export const projects: readonly Project[] = [
  {
    slug: "delyte-academy",
    index: "01",
    title: "Delyte Academy",
    category: "Education / CBT platform",
    summary:
      "A modern online learning and Computer-Based Testing platform that brings courses, study materials, practice questions and assessments into one place.",
    tech: ["Next.js", "Supabase", "GSAP"],
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1794848972/Screenshot_from_2026-11-16_18-09-10_tz6fju.png",
    tone: "charcoal",
    live: "https://delyte-academy.vercel.app/",
    github: "https://github.com/Delyte-01/Delyte-academy",
    featured: true,
    mock: false,
    caseStudy: {
      overview:
        "Delyte Academy is an online learning and Computer-Based Testing (CBT) platform designed to help students access courses, study materials, practice questions and assessments in one place.",
    },
  },
  {
    slug: "velora-beauty",
    index: "02",
    title: "Velora Beauty",
    category: "E-commerce / Beauty",
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1794849270/Screenshot_from_2026-11-16_18-14-12_p0v6fy.png",
    live: "https://velora-beauty-site-six.vercel.app/",
    github: "https://github.com/Delyte-01/velora-beauty",
    summary:
      "A skincare storefront with an editorial feel: large product photography, shade and concern filters, and a cart drawer that keeps shoppers on the page.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Zustand"],
    tone: "pink",
    featured: true,
    mock: true,
    caseStudy: {
      overview:
        "Velora is a storefront for a skincare and beauty label. The brief was to make browsing feel like turning the pages of a magazine while keeping the route from product to checkout short, especially on a phone.",
      challenge:
        "Beauty shops tend to bury products under banners, pop-ups and stacked filters. The goal was to keep a calm, editorial look without adding taps between discovering a product and adding it to the bag.",
      role: "Design and frontend development: information architecture, component library, responsive layouts, cart state and page transitions.",
      approach: [
        "Started mobile-first with a two-column product grid and a sticky quick-add bar, then scaled the layout up to wider screens.",
        "Defined a small set of design tokens (type scale, spacing, one accent colour) so every page stays consistent as the catalogue grows.",
        "Product pages lead with large imagery, a short ingredient list and delivery details above the fold.",
        "Kept motion to transitions that explain state: the cart drawer, image swaps and filter changes.",
      ],
      features: [
        "Filter by concern, skin type and shade",
        "Product page with image gallery and ingredient breakdown",
        "Cart drawer with quantity controls and a running subtotal",
        "Wishlist that persists between visits",
        "Fully keyboard-accessible navigation and focus states",
      ],
    },
  },
  {
    slug: "estora-properties",
    index: "03",
    title: "ESTORA Properties",
    category: "Real estate",
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1794849658/Screenshot_from_2026-11-16_18-20-43_oef6dd.png",
    live: "https://estora-real-estate.vercel.app/",
    github: "https://github.com/Delyte-01/estora-app",
    summary:
      "A property listing site built around search: filter by location, price and bedrooms, compare listings side by side and book a viewing in a few taps.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    tone: "electric",
    featured: true,
    mock: true,
    caseStudy: {
      overview:
        "ESTORA is a listing experience for a real estate agency. It puts search first, then gives each property a clear, structured page so buyers can judge a place quickly and book a viewing without leaving the site.",
      challenge:
        "Listing sites often overwhelm people with filters and inconsistent property data. The task was to make search fast to use, keep every listing in the same predictable structure, and stay readable on slow mobile connections.",
      role: "Design and frontend development: search and filter UI, listing templates, gallery, enquiry form and responsive layouts.",
      approach: [
        "Modelled a listing as typed data (price, location, rooms, size, features) so cards, filters and detail pages all render from one source.",
        "Kept filters in the URL, so a search can be shared or reopened and the back button behaves as expected.",
        "Used optimised, lazily loaded gallery images with fixed aspect ratios to avoid layout shift.",
        "Built the enquiry form with clear validation messages and large touch targets.",
      ],
      features: [
        "Search by location, price range, property type and bedrooms",
        "Grid and map-style list views",
        "Property page with gallery, key facts and location notes",
        "Save and compare shortlisted properties",
        "Viewing request form",
      ],
    },
  },
  {
    slug: "medray-labs",
    index: "04",
    title: "MedRay Labs",
    category: "Healthcare / Diagnostics",
    summary:
      "A diagnostics lab website that lists tests in plain language, explains preparation steps and lets patients request a home sample collection online.",
    tech: ["React", "Next.js", "Tailwind CSS", "React Hook Form"],
    tone: "ivory",
    featured: true,
    mock: true,
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1794849774/Screenshot_from_2026-11-16_18-22-38_s6ssyo.png",
    live: "https://medray-lab-site.vercel.app/",
    github: "https://github.com/Delyte-01/medray-lab",
    caseStudy: {
      overview:
        "MedRay Labs is a website for a diagnostics laboratory. It explains each test in plain language, shows how to prepare, and lets patients book a lab visit or home sample collection without calling the front desk.",
      challenge:
        "Health information has to be trusted at a glance. The aim was clear typography, honest wording and a booking flow that works for people of every age and every level of comfort with technology.",
      role: "Design and frontend development: content structure, accessible components, booking flow and responsive layouts.",
      approach: [
        "Grouped tests by purpose (blood work, imaging, screening) and added a plain-language summary and preparation notes to each.",
        "Designed to WCAG AA contrast with generous text sizes, visible focus states and labels on every form field.",
        "Split booking into short steps with a clear summary before submitting.",
        "Kept pages light so important information loads quickly on mobile data.",
      ],
      features: [
        "Searchable test directory with preparation instructions",
        "Home sample collection and lab visit booking",
        "Opening hours and branch information",
        "Results enquiry page",
        "Accessible forms with inline validation",
      ],
    },
  },
  {
    slug: "neoai",
    index: "05",
    title: "NeoAI",
    category: "AI / Interface",
    summary:
      "A responsive landing page for a conceptual AI assistant, showcasing product features, benefits and integration use cases.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "GSAP", "Lenis"],
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1750670564/Screenshot_of_NeoAI_1_duw3na.jpg",
    tone: "charcoal",
    live: "https://neo-ai-app.vercel.app/",
    github: "https://github.com/Delyte-01/Neo-Ai",
    featured: false,
    mock: false,
    caseStudy: {
      overview:
        "A futuristic landing page for a conceptual AI assistant, built around motion design and state-driven interactions.",
      approach: [
        "GSAP and Lenis combined into one smooth-scroll experience, avoiding jank during heavy scroll animation.",
        "A modular Next.js component architecture that stays responsive while keeping complex animation triggers.",
        "“Clarity over clutter”: advanced motion without losing an intuitive, accessible interface.",
      ],
    },
  },
  {
    slug: "playo",
    index: "06",
    title: "Playo Gamifi",
    category: "Web3 / Gaming",
    summary:
      "A modern gamified web UI with animations, clean layouts and optimised performance.",
    tech: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP"],
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1750671816/Screenshot_of_GAMI_FI_ah9xgl.jpg",
    tone: "electric",
    live: "https://gamifi-net.netlify.app/",
    github: "https://github.com/Delyte-01/gami-fi",
    featured: false,
    mock: false,
    caseStudy: {
      overview:
        "A gamified web interface for a Web3 gaming concept, built to feel energetic while staying clean and quick to load.",
      approach: [
        "Component-based React and Next.js build with typed props, so sections can be reused and rearranged.",
        "GSAP animations used to guide attention between sections rather than decorate them.",
        "Performance kept in view from the start: optimised images and animation limited to transform and opacity.",
      ],
    },
  },
  {
    slug: "cinemax",
    index: "07",
    title: "CineMax",
    category: "Entertainment / Discovery",
    summary:
      "A movie and TV discovery platform to explore, search and filter content from the TMDB API.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "TMDB API"],
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1753439702/Screenshot_of_CineMax_1_nbbdfd.jpg",
    tone: "charcoal",
    live: "https://cinemax-site.vercel.app/",
    github: "https://github.com/Delyte-01/movie-app",
    featured: false,
    mock: false,
    caseStudy: {
      overview:
        "CineMax is a discovery platform for movies and TV shows, powered by the TMDB API. It lets people browse what is popular, search by title and narrow results with filters.",
      approach: [
        "Typed the TMDB responses with TypeScript so data problems show up at build time rather than in the UI.",
        "Kept search and filter state in one place and rendered results from it.",
        "Used responsive poster grids with lazy-loaded images.",
      ],
      features: [
        "Browse movies and TV shows",
        "Search by title",
        "Filter results",
        "Responsive poster grid",
      ],
    },
  },
  {
    slug: "boe-associates",
    index: "08",
    title: "BOE Associates",
    category: "Finance / Corporate",
    summary:
      "A modern financial services website built to streamline business operations and strengthen client engagement.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Lenis"],
    image:
      "https://res.cloudinary.com/dk5mfu099/image/upload/v1769495686/Screenshot_of_BOE_Associates_Limited_phnmyf.jpg",
    tone: "ivory",
    live: "https://boe-associates-limited.vercel.app/",
    github: "https://github.com/Delyte-01/novaClone",
    featured: false,
    mock: false,
    caseStudy: {
      overview:
        "A corporate website for a financial services firm, designed to present its services clearly and make it easy for prospective clients to get in touch.",
      approach: [
        "Next.js and TypeScript with Tailwind CSS for a fast, responsive build.",
        "Lenis for smooth scrolling that stays calm and professional.",
        "Clear service sections and calls to action to support client engagement.",
      ],
    },
  },
] as const;

export const featuredProjects = projects.filter((p) => p.featured);

export const getProject = (slug: string) =>
  projects.find((p) => p.slug === slug);

export function getAdjacentProjects(slug: string) {
  const i = projects.findIndex((p) => p.slug === slug);
  if (i === -1) return { prev: undefined, next: undefined };
  return {
    prev: projects[(i - 1 + projects.length) % projects.length],
    next: projects[(i + 1) % projects.length],
  };
}
