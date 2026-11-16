import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "header" | "footer" | "nav";
}

/** Consistent page gutters and max width for every V3 section. */
export function Container({ as: Tag = "div", className, ...props }: ContainerProps) {
  return (
    <Tag
      className={cn("mx-auto w-full max-w-[1440px] px-[var(--space-gutter)]", className)}
      {...props}
    />
  );
}
