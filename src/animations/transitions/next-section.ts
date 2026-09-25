import gsap from "gsap";
import { createMatchMedia } from "../utils/matchMedia";

let scrollMm: gsap.MatchMedia | null = null;

const setup = (section: HTMLElement) => {
  const textPath = section.querySelector("#nextTextPath");
  const svg = section.querySelector(".next-section__svg");
  const reveal = section.querySelector(".next-section__reveal");

  if (!textPath || !svg || !reveal) {
    console.warn("[next-section] Required elements not found");
    return;
  }

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

    // ─── Phase 2 (0.50 → 0.55): Small circle dot appears ───
    tl.to(
      reveal,
      {
        clipPath: "circle(2% at 50% 55%)",
        duration: 0.05,
        ease: "power1.out",
      },
      0.50,
    );

    // ─── Phase 3 (0.55 → 0.62): SVG text fades out ───
    tl.to(
      svg,
      {
        opacity: 0,
        duration: 0.07,
        ease: "power1.in",
      },
      0.55,
    );

    // ─── Phase 4 (0.60 → 0.95): Circle expands, revealing contact section ───
    tl.to(
      reveal,
      {
        clipPath: "circle(150% at 50% 55%)",
        duration: 0.35,
        ease: "power2.inOut",
      },
      0.60,
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
