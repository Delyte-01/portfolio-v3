/** Verified against the CV in /public/maduneche_samuel_CV.pdf. */

export interface SkillGroup {
  readonly title: string;
  /** One line on what this group of tools is used for. */
  readonly blurb: string;
  readonly items: readonly string[];
}

export const skillGroups: readonly SkillGroup[] = [
  {
    title: "Frontend",
    blurb: "Interfaces, components and state.",
    items: ["HTML5", "CSS3 / SCSS", "JavaScript (ES6+)", "TypeScript", "React", "Next.js", "Redux", "Tailwind CSS"],
  },
  {
    title: "Motion & interaction",
    blurb: "Scroll, transitions and small details.",
    items: ["GSAP", "ScrollTrigger", "Lenis", "Responsive design"],
  },
  {
    title: "Data & APIs",
    blurb: "Fetching, storing and syncing data.",
    items: ["REST APIs", "Axios", "Supabase"],
  },
  {
    title: "Tools & workflow",
    blurb: "Design handoff, testing and shipping.",
    items: ["Git", "GitHub", "Figma", "Vite", "Webpack", "Jest", "Vercel"],
  },
] as const;

export interface ExperienceItem {
  readonly role: string;
  readonly org: string;
  readonly period: string;
  readonly current: boolean;
  readonly points: readonly string[];
}

export const experience: readonly ExperienceItem[] = [
  {
    role: "Lead Frontend Developer",
    org: "LiteUpper",
    period: "Nov 2025 — Present",
    current: true,
    points: [
      "Architecting the frontend of a school management system from scratch with Next.js and TypeScript.",
      "Working with a backend developer on API schemas for student records, grading and admin dashboards.",
      "Leading UI/UX implementation for non-technical users, and managing the current beta-testing phase.",
    ],
  },
  {
    role: "Frontend Developer",
    org: "Daowakanda (Web3 / DAO platform)",
    period: "Jan 2025 — Present",
    current: true,
    points: [
      "Building a high-performance interface for blockchain interactions and DAO governance with Next.js, React and Tailwind CSS.",
      "Optimising the application for mobile responsiveness.",
      "Working in an Agile team: stand-ups, sprint planning and code reviews.",
    ],
  },
] as const;

export interface EducationItem {
  readonly title: string;
  readonly issuer: string;
  readonly period: string;
}

export const education: readonly EducationItem[] = [
  { title: "Frontend Development Internship", issuer: "Stanix Consult", period: "Nov — Dec 2025" },
  { title: "Frontend Development Training", issuer: "Tech 365, Ikeja", period: "Jan — Mar 2024" },
] as const;
