"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { ArrowUpRight, Menu, X } from "lucide-react";

import { StatusDot } from "@/components/ui/status-dot";
import { mailHref, navItems, site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

/** Tracks which `[data-section]` is crossing the middle of the viewport. */
function useActiveSection(enabled: boolean, fallback: string | null) {
  const [active, setActive] = useState<string | null>(fallback);

  useEffect(() => {
    if (!enabled) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.getAttribute("data-section"));
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [enabled]);

  return enabled ? active : fallback;
}

const Header = () => {
  const pathname = usePathname();
  const lenis = useLenis();
  const isHome = pathname === "/";
  const activeId = useActiveSection(isHome, pathname.startsWith("/work") ? "work" : null);

  const [scrolled, setScrolled] = useState(false);
  // Menu is "open" only for the route it was opened on, so it closes itself on navigation.
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const setMenuOpen = useCallback(
    (open: boolean | ((o: boolean) => boolean)) => {
      setMenuPath((cur) => {
        const next = typeof open === "function" ? open(cur === pathname) : open;
        return next ? pathname : null;
      });
    },
    [pathname],
  );
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMenuLinkRef = useRef<HTMLAnchorElement>(null);

  // Background appears after leaving the top of the page.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const raf = requestAnimationFrame(onScroll); // handles reload mid-page
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Sliding active-section indicator (transform + width only).
  const measure = useCallback(() => {
    const list = listRef.current;
    const el = activeId ? linkRefs.current[activeId] : null;
    if (!list || !el) {
      setIndicator(null);
      return;
    }
    const l = list.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setIndicator({ left: r.left - l.left, width: r.width });
  }, [activeId]);

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Mobile menu: scroll lock, Escape to close, focus handling.
  useEffect(() => {
    if (!menuOpen) return;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMenuLinkRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lenis?.start();
    };
  }, [menuOpen, lenis, setMenuOpen]);

  // Smooth-scroll to in-page anchors when already on the homepage.
  const handleAnchor = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!isHome) return; // let Next.js navigate to "/#id"
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    setMenuOpen(false);
    if (lenis) {
      lenis.scrollTo(target, { offset: -72 });
    } else {
      target.scrollIntoView();
    }
    history.replaceState(null, "", `/#${id}`);
  };

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-ivory"
      >
        Skip to content
      </a>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-[100] transition-[background-color,border-color] duration-500 ease-[var(--ease-atelier)]",
          "border-b",
          scrolled || menuOpen
            ? "border-hairline bg-ivory/85 backdrop-blur-md"
            : "border-transparent bg-transparent",
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-[var(--space-gutter)] md:h-[72px]"
        >
          <Link
            href="/"
            aria-label={`${site.name} — home`}
            className="logo-link relative z-[110] flex items-center"
            onClick={(e) => {
              if (isHome && lenis) {
                e.preventDefault();
                lenis.scrollTo(0);
              }
            }}
          >
            <Logo className="h-8 w-auto md:h-9" />
          </Link>

          {/* Desktop links */}
          <ul ref={listRef} className="relative hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <Link
                    ref={(el) => {
                      linkRefs.current[item.id] = el;
                    }}
                    href={item.href}
                    onClick={(e) => handleAnchor(e, item.id)}
                    aria-current={isActive ? "location" : undefined}
                    className={cn(
                      "block px-4 py-2 text-sm tracking-tight transition-colors duration-300",
                      isActive ? "text-ink" : "text-muted-ink hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-px left-0 h-0.5 rounded-full bg-brand-gradient transition-[transform,width,opacity] duration-500 ease-[var(--ease-atelier)]"
              style={{
                width: indicator?.width ?? 0,
                transform: `translateX(${indicator?.left ?? 0}px)`,
                opacity: indicator ? 1 : 0,
              }}
            />
          </ul>

          <div className="flex items-center gap-4">
            <p className="t-meta hidden items-center gap-2 text-muted-ink lg:flex">
              <StatusDot />
              {site.availability}
            </p>
            <Link
              href={mailHref}
              className="t-meta hidden items-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-ink transition-colors duration-300 hover:border-electric hover:bg-electric hover:text-white md:inline-flex"
            >
              Say hello
              <ArrowUpRight aria-hidden strokeWidth={1.5} className="size-3.5" />
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              className="relative z-[110] -mr-2 grid size-11 place-items-center text-ink md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X strokeWidth={1.5} className="size-6" /> : <Menu strokeWidth={1.5} className="size-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        className={cn(
          "theme-dark fixed inset-0 z-[90] flex flex-col justify-between gap-10 overflow-y-auto overscroll-contain px-[var(--space-gutter)] pb-10 pt-24 md:hidden",
          "transition-[clip-path,visibility] duration-700 ease-[var(--ease-expo)]",
          menuOpen
            ? "visible [clip-path:inset(0_0_0_0)]"
            : "invisible [clip-path:inset(0_0_100%_0)]",
        )}
      >
        <ul className="flex flex-col gap-2">
          {navItems.map((item, i) => (
            <li key={item.id}>
              <Link
                ref={i === 0 ? firstMenuLinkRef : undefined}
                href={item.href}
                onClick={(e) => handleAnchor(e, item.id)}
                className="flex min-h-14 items-baseline gap-4 border-b border-border py-3 font-heading font-bold text-[2.5rem] leading-none text-ivory"
              >
                <span className="t-meta font-mono text-pink-ink">0{i + 1}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-4">
          <p className="t-meta flex items-center gap-2 text-muted-foreground">
            <StatusDot />
            {site.availability}
          </p>
          <Link href={mailHref} className="text-lg text-ivory underline decoration-white underline-offset-8">
            {site.email}
          </Link>
          <p className="t-meta text-muted-foreground">{site.location}</p>
        </div>
      </div>
    </>
  );
};

export default Header;
