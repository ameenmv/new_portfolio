import gsap from "gsap";
import { createMatchMedia } from "../utils/matchMedia";

let scrollMm: gsap.MatchMedia | null = null;

const setup = (section: HTMLElement) => {
  const textPath = section.querySelector("#nextTextPath");
  const svg = section.querySelector(".next-section__svg");
  const orb = section.querySelector(".next-section__orb");

  if (!textPath || !svg || !orb) {
    console.warn("[next-section] Required elements not found", { textPath, svg, orb });
    return;
  }

  // Set initial orb state via GSAP (so GSAP controls all transforms)
  gsap.set(orb, { scale: 0 });

  scrollMm = createMatchMedia((_context, { isMobile }) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
      },
    });

    // ─── Phase 1 (0 → 0.55): Text scrolls along the curved path ───
    tl.fromTo(
      textPath,
      { attr: { startOffset: "100%" } },
      {
        attr: { startOffset: isMobile ? "-150%" : "-100%" },
        duration: 0.55,
        ease: "none",
      },
      0,
    );

    // ─── Phase 2 (0.50 → 0.55): Orb fades in as a small dot ───
    tl.to(
      orb,
      {
        opacity: 1,
        scale: 1,
        duration: 0.05,
        ease: "power1.out",
      },
      0.50,
    );

    // ─── Phase 3 (0.55 → 0.65): SVG text fades out, orb moves down ───
    tl.to(
      svg,
      {
        opacity: 0,
        duration: 0.08,
        ease: "power1.in",
      },
      0.55,
    );

    tl.to(
      orb,
      {
        y: isMobile ? 80 : 120,
        duration: 0.15,
        ease: "none",
      },
      0.55,
    );

    // ─── Phase 4 (0.65 → 1.0): Orb expands to fill viewport ───
    tl.to(
      orb,
      {
        scale: isMobile ? 120 : 150,
        duration: 0.35,
        ease: "power2.in",
      },
      0.65,
    );
  });
};

const destroy = () => {
  if (scrollMm) {
    scrollMm.revert();
    scrollMm = null;
  }
};

export const nextSection = { setup, destroy };
