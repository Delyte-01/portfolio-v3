import { cn } from "@/lib/utils";

interface EyebrowProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /** Optional section number, e.g. "01". */
  index?: string;
}

/** Small mono annotation used above headings: `01 — Selected Work`. */
export function Eyebrow({ index, className, children, ...props }: EyebrowProps) {
  return (
    <p
      data-eyebrow=""
      className={cn("t-meta flex items-center gap-3 text-muted-foreground", className)}
      {...props}
    >
      {index ? <span className="text-pink-ink">{index}</span> : null}
      {index ? <span aria-hidden className="h-px w-8 bg-current opacity-40" /> : null}
      <span>{children}</span>
    </p>
  );
}
