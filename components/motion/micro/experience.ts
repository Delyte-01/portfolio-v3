import { gsap, ScrollTrigger } from "@/lib/gsap";
import { cleanupBag, noop, qsa, type Cleanup } from "@/lib/motion";

/**
 * EXPERIENCE (spec: gsap-animation.md)
 *   F11  timeline line draws with scroll, dots pulse once
 *   F12  active job card + period scramble
 */

// ── F11 ───────────────────────────────────────────────────────────────────

function initTimeline(): Cleanup {
  const ol = document.querySelector<HTMLElement>("#experience ol");
  const line = document.querySelector<HTMLElement>("[data-timeline-line]");
  const items = qsa("#experience ol > li");
  if (!ol || !items.length) return noop;

  const bag = cleanupBag();

  if (line) {
    // Scrubbed: ease "none" and scrub true, because Lenis already eases the scroll position.
    const draw = gsap.fromTo(
      line,
      { scaleY: 0 },
      { scaleY: 1, ease: "none", scrollTrigger: { trigger: ol, start: "top 70%", end: "bottom 70%", scrub: true } },
    );
    bag.add(() => {
      draw.scrollTrigger?.kill();
      draw.kill();
      gsap.set(line, { clearProps: "transform" });
    });
  }

  const pulses: HTMLElement[] = [];
  items.forEach((li) => {
    const pulse = li.querySelector<HTMLElement>("[data-dot-pulse]");
    if (!pulse) return;
    pulses.push(pulse);
    const st = ScrollTrigger.create({
      trigger: li,
      start: "top 70%",
      once: true,
      onEnter: () => {
        gsap.fromTo(
          pulse,
          { scale: 1, autoAlpha: 0.6 },
          { scale: 2.8, autoAlpha: 0, duration: 1.1, ease: "sleek", overwrite: "auto" },
        );
      },
    });
    bag.add(() => st.kill());
  });

  bag.add(() => {
    if (!pulses.length) return;
    gsap.killTweensOf(pulses);
    gsap.set(pulses, { clearProps: "transform,opacity,visibility" });
  });
  return bag.run;
}

// ── F12 ───────────────────────────────────────────────────────────────────

const DIM = 0.5;

function initActiveJobs(): Cleanup {
  const items = qsa("#experience ol > li");
  if (!items.length) return noop;

  const bag = cleanupBag();
  const jobs: HTMLElement[] = [];

  items.forEach((li) => {
    // Opacity goes on the inner card, never on the li (the li carries data-reveal).
    const job = li.querySelector<HTMLElement>("[data-job]");
    if (!job) return;
    const period = li.querySelector<HTMLElement>("[data-period]");
    const original = period?.textContent ?? "";
    let scrambled = false;

    jobs.push(job);
    gsap.set(job, { opacity: DIM });

    const scramble = () => {
      if (!period || !original || scrambled) return;
      scrambled = true;
      // Freeze the pill's width while the digits run, so neighbours never shift.
      const width = period.getBoundingClientRect().width;
      period.style.width = `${width}px`;
      period.style.overflow = "hidden";
      period.style.whiteSpace = "nowrap";
      gsap.to(period, {
        duration: 0.9,
        ease: "none",
        scrambleText: { text: original, chars: "0123456789", speed: 0.6, revealDelay: 0.1 },
        onComplete: () => {
          period.textContent = original;
          period.style.removeProperty("width");
          period.style.removeProperty("overflow");
          period.style.removeProperty("white-space");
        },
      });
    };

    const st = ScrollTrigger.create({
      trigger: li,
      start: "top 60%",
      end: "bottom 40%",
      onToggle: (self) => {
        gsap.to(job, { opacity: self.isActive ? 1 : DIM, duration: 0.6, ease: "sleek", overwrite: "auto" });
        if (self.isActive) scramble();
      },
    });

    bag.add(() => {
      st.kill();
      if (period) {
        gsap.killTweensOf(period);
        period.textContent = original;
        period.style.removeProperty("width");
        period.style.removeProperty("overflow");
        period.style.removeProperty("white-space");
      }
    });
  });

  bag.add(() => {
    if (!jobs.length) return;
    gsap.killTweensOf(jobs);
    gsap.set(jobs, { clearProps: "opacity" });
  });
  return bag.run;
}

export function initExperience(): Cleanup {
  const bag = cleanupBag();
  bag.add(initTimeline());
  bag.add(initActiveJobs());
  return bag.run;
}
