import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { navItems, site } from "@/lib/site";

/** Slim black footer: wordmark and links. An orange rule joins it to Contact. (Back-to-top is the floating button in the root layout.) */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="theme-ink border-t-4 border-t-electric">
      <Container className="flex flex-col gap-10 py-12 md:flex-row md:items-end md:justify-between">
        <div role="img" aria-label={site.name} data-footer-logo="" className="logo-link">
          <Logo variant="reversed" className="h-[clamp(3.5rem,9vw,6.5rem)] w-auto" />
        </div>

        <nav aria-label="Footer">
          <ul className="t-meta flex flex-wrap gap-x-8 gap-y-1 text-muted-foreground">
            {navItems.map((n) => (
              <li key={n.id}>
                <Link href={n.href} className="inline-block py-2 transition-colors duration-300 hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Container className="t-meta border-t border-border py-6 text-muted-foreground">
        <p>
          © {year} {site.fullName}
        </p>
      </Container>
    </footer>
  );
}
