import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArrowLinkProps extends Omit<React.ComponentProps<typeof Link>, "href"> {
  href: string;
  /** Opens in a new tab with safe rel attributes. */
  external?: boolean;
}

/** Text link with an arrow that nudges on hover/focus (pure CSS, no JS). */
export function ArrowLink({ href, external, className, children, ...props }: ArrowLinkProps) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "group/arrow inline-flex min-h-11 items-center gap-1.5 text-sm font-medium tracking-tight md:min-h-9",
        "underline decoration-current/25 underline-offset-[6px] transition-colors duration-300",
        "hover:text-electric-ink hover:decoration-electric focus-visible:text-electric-ink",
        className,
      )}
      {...props}
    >
      {children}
      {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
      <ArrowUpRight
        aria-hidden
        strokeWidth={1.5}
        className="size-4 transition-transform duration-300 ease-[var(--ease-atelier)] group-hover/arrow:-translate-y-0.5 group-hover/arrow:translate-x-0.5 group-focus-visible/arrow:-translate-y-0.5 group-focus-visible/arrow:translate-x-0.5"
      />
    </Link>
  );
}
