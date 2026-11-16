import { cn } from "@/lib/utils";

interface MarqueeProps {
  items: readonly string[];
  /** Seconds for one full loop. */
  duration?: number;
  reverse?: boolean;
  className?: string;
  /** Classes for each item (size, font). */
  itemClassName?: string;
  separator?: string;
}

/**
 * Endless scrolling text band. Pure CSS; decorative, so it is hidden from
 * assistive tech. Two identical tracks slide by exactly their own width.
 */
export function Marquee({
  items,
  duration = 40,
  reverse,
  className,
  itemClassName,
  separator = "✦",
}: MarqueeProps) {
  const row = [...items, ...items];
  return (
    <div aria-hidden className={cn("marquee flex overflow-hidden select-none", className)}>
      {[0, 1].map((n) => (
        <ul
          key={n}
          className="animate-marquee flex min-w-full shrink-0 items-center"
          style={{ animationDuration: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
        >
          {row.map((item, i) => (
            <li key={`${item}-${i}`} className={cn("flex items-center gap-6 pl-6 whitespace-nowrap", itemClassName)}>
              {item}
              <span className="opacity-70">{separator}</span>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
