import { cn } from "@/lib/utils";
import { Container } from "./container";

interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "id"> {
  id: string;
  /** `dark` flips tokens locally via `.theme-dark`. */
  tone?: "light" | "dark" | "ink";
  /** Draw the faint architectural grid behind the content. */
  grid?: boolean;
  /** Soft colour wash behind the content. */
  glow?: boolean;
  /** Remove default vertical padding (e.g. for the hero). */
  flush?: boolean;
}

/**
 * Page section wrapper: id anchor, tone, vertical rhythm and gutters.
 * `data-section` is what the navigation uses to track the active section.
 */
export function Section({
  id,
  tone = "light",
  grid = false,
  glow = false,
  flush = false,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      data-section={id}
      data-tone={tone}
      className={cn(
        "relative isolate",
        tone === "dark" && "theme-dark",
        tone === "ink" && "theme-ink",
        !flush && "py-[var(--space-section)]",
        className,
      )}
      {...props}
    >
      {glow ? <div aria-hidden className="section-glow pointer-events-none absolute inset-0 -z-20" /> : null}
      {grid ? (
        <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-60" />
      ) : null}
      <Container>{children}</Container>
    </section>
  );
}
