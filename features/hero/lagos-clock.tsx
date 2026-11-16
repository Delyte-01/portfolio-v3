"use client";

import { useEffect, useRef } from "react";

import { site } from "@/lib/site";

/** Ticking local time for the "Based in" cell. Writes straight to the DOM: no React re-render per second. */
export function LagosClock({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: site.timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const tick = () => {
      el.textContent = `${fmt.format(new Date())} ${site.utcOffset}`;
    };
    tick();
    let id = window.setInterval(tick, 1000);
    const onVisibility = () => {
      window.clearInterval(id);
      if (!document.hidden) {
        tick();
        id = window.setInterval(tick, 1000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      --:--:-- {site.utcOffset}
    </span>
  );
}
