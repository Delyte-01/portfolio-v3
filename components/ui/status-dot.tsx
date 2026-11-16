import { cn } from "@/lib/utils";

/** Small pulsing availability indicator. Pulse is disabled under reduced motion. */
export function StatusDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2", className)}>
      <span className="absolute inset-0 animate-ping rounded-full bg-mint/70 [animation-duration:2.4s]" />
      <span className="relative size-2 rounded-full bg-mint" />
    </span>
  );
}
