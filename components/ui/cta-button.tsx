import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const ctaVariants = cva(
  [
    "group/cta relative inline-flex min-h-12 items-center justify-center gap-2 overflow-hidden",
    "rounded-full px-7 text-sm font-medium tracking-tight whitespace-nowrap",
    "border transition-[color,background-color,border-color,translate,filter] duration-300 ease-[var(--ease-atelier)] select-none",
  ],
  {
    variants: {
      variant: {
        solid: "border-foreground bg-foreground text-background hover:border-[var(--cta-hover)] hover:bg-[var(--cta-hover)] hover:text-white",
        accent:
          "bg-brand-gradient border-transparent text-white shadow-[0_10px_30px_-10px_var(--electric)] hover:-translate-y-0.5 hover:brightness-110",
        outline: "border-foreground/25 bg-transparent text-foreground hover:border-foreground hover:bg-foreground hover:text-background",
      },
    },
    defaultVariants: { variant: "solid" },
  },
);

interface CtaButtonProps
  extends Omit<React.ComponentProps<typeof Link>, "href">,
    VariantProps<typeof ctaVariants> {
  href: string;
  external?: boolean;
  /** Hook for the Phase 5 magnetic-button behaviour. */
  magnetic?: boolean;
  arrow?: boolean;
}

/** Primary call-to-action link. Renders an anchor for correct semantics. */
export function CtaButton({
  href,
  variant,
  external,
  magnetic = true,
  arrow = true,
  className,
  children,
  ...props
}: CtaButtonProps) {
  return (
    <Link
      href={href}
      data-magnetic={magnetic ? "" : undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(ctaVariants({ variant }), className)}
      {...props}
    >
      <span>{children}</span>
      {arrow ? (
        <ArrowUpRight
          aria-hidden
          strokeWidth={1.5}
          className="size-4 transition-transform duration-300 ease-[var(--ease-atelier)] group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
        />
      ) : null}
    </Link>
  );
}
