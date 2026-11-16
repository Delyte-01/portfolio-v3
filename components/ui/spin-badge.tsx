import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinBadgeProps {
  /** Text set around the circle. Keep it ~28–34 characters. */
  text: string;
  /** Unique per page: used for the SVG text path. */
  id: string;
  className?: string;
}

/** Round sticker with text running around its edge. Decorative. */
export function SpinBadge({ text, id, className }: SpinBadgeProps) {
  const label = `${text.toUpperCase()} • `.repeat(2);
  return (
    <div aria-hidden className={cn("relative grid place-items-center rounded-full border-2 border-ink", className)}>
      <svg viewBox="0 0 120 120" className="animate-spin-slow absolute inset-0 size-full">
        <defs>
          <path id={id} d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" />
        </defs>
        <text fontFamily="var(--font-montserrat), sans-serif" fontWeight="600" fontSize="10.5" letterSpacing="2.1" fill="currentColor">
          <textPath href={`#${id}`} textLength="276" lengthAdjust="spacing">
            {label}
          </textPath>
        </text>
      </svg>
      <ArrowUpRight strokeWidth={2} className="size-1/4 rotate-0" />
    </div>
  );
}
