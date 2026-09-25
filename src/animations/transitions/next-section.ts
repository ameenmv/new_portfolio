import gsap from "gsap";
import { createMatchMedia } from "../utils/matchMedia";

let scrollMm: gsap.MatchMedia | null = null;

const setup = (section: HTMLElement) => {
  const textPath = section.querySelector("#nextTextPath");

  if (!textPath) {
    console.warn("[next-section] textPath element not found");
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

    // Phase 1 (0 → 0.85): Animate textPath startOffset from 100% to a negative value
    // This moves the text along the curved SVG path from right to left, driven by scroll
    tl.fromTo(
      textPath,
      { attr: { startOffset: "100%" } },
      {
        attr: { startOffset: isMobile ? "-150%" : "-100%" },
        duration: 0.85,
        ease: "none",
      },
      0,
    );

    // Phase 2 (0.85 → 1.0): Scale down the container and fade out
    // This creates a smooth reveal of the contact section below
    const container = section.querySelector(".next-section__container");
    if (container) {
      tl.to(
        container,
        {
          scale: 0.5,
          opacity: 0,
          duration: 0.15,
          ease: "power2.in",
        },
        0.85,
      );
    }
  });
};

const destroy = () => {
  if (scrollMm) {
    scrollMm.revert();
    scrollMm = null;
  }
};

export const nextSection = { setup, destroy };
