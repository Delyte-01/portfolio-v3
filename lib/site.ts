/**
 * Single source of truth for identity, contact and navigation.
 * Values come from the existing V2 contact section and the CV in /public.
 */
export const site = {
  name: "Delyte",
  fullName: "Maduneche Samuel Ezechukwu",
  role: "Frontend Developer / Creative Technologist",
  roleLabel: "FRONTEND DEVELOPER / CREATIVE TECHNOLOGIST",
  location: "Ikeja, Lagos, Nigeria",
  timezone: "Africa/Lagos",
  utcOffset: "UTC+1",
  availability: "Available for new projects",
  url: "https://delyte-portfolio-v2.vercel.app",
  description:
    "Delyte is the portfolio of Maduneche Samuel, a frontend developer in Lagos building modern, intuitive and visually considered web experiences with React and Next.js.",
  email: "madunecheezechukwu@gmail.com",
  whatsapp: {
    number: "2348139760048",
    message: "Hi Delyte, I saw your portfolio and I'd like to talk about a project.",
  },
  cv: "/maduneche_samuel_CV.pdf",
  socials: {
    github: "https://github.com/Delyte-01",
    linkedin: "https://www.linkedin.com/in/sammy-delyte-0a1224302",
  },
} as const;

export const whatsappHref = `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(
  site.whatsapp.message,
)}`;

export const mailHref = `mailto:${site.email}`;

export interface NavItem {
  readonly id: string;
  readonly label: string;
  readonly href: string;
}

/** Section ids double as in-page anchors and active-section keys. */
export const navItems: readonly NavItem[] = [
  { id: "work", label: "Selected Work", href: "/#work" },
  { id: "about", label: "About", href: "/#about" },
  { id: "contact", label: "Contact", href: "/#contact" },
] as const;
