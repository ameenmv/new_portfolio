import gsap from "gsap";
import { createMatchMedia } from "../utils/matchMedia";
import { sceneWeightsInOut } from "../scenes";
import { animations as avatarAnimations } from "../../three/objects/avatar/animations";

let scrollMm: gsap.MatchMedia | null = null;
let canvasOriginalParent: HTMLElement | null = null;
let canvasOriginalNextSibling: Node | null = null;
let canvasInReveal = false;

const moveCanvasToReveal = (reveal: Element) => {
  const canvas = document.querySelector(".three-canvas") as HTMLElement;
  if (!canvas || canvasInReveal) return;

  // Save original DOM position
  canvasOriginalParent = canvas.parentElement;
  canvasOriginalNextSibling = canvas.nextSibling;

  // Move canvas INTO the reveal (before the content div)
  reveal.insertBefore(canvas, reveal.firstChild);

  // Add reveal-mode class (overrides the contact positioning)
  canvas.classList.add("three-canvas-in-reveal");

  // Trigger Three.js renderer resize
  window.dispatchEvent(new Event("resize"));

  canvasInReveal = true;
};

const restoreCanvas = () => {
  const canvas = document.querySelector(".three-canvas") as HTMLElement;
  if (!canvas || !canvasOriginalParent || !canvasInReveal) return;

  // Move canvas back to its original parent
  if (canvasOriginalNextSibling && canvasOriginalNextSibling.parentNode === canvasOriginalParent) {
    canvasOriginalParent.insertBefore(canvas, canvasOriginalNextSibling);
  } else {
    canvasOriginalParent.appendChild(canvas);
  }

  // Remove reveal-mode class
  canvas.classList.remove("three-canvas-in-reveal");

  canvasInReveal = false;
};

const setup = (section: HTMLElement) => {
  const textPath = section.querySelector("#nextTextPath");
  const svg = section.querySelector(".next-section__svg");
  const reveal = section.querySelector(".next-section__reveal");
  const revealContent = section.querySelector(".next-section__reveal-content");

  if (!textPath || !svg || !reveal || !revealContent) {
    console.warn("[next-section] Required elements not found");
    return;
  }

  scrollMm = createMatchMedia((_context, { isMobile }) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          // Move canvas into reveal when the circle starts expanding
          if (self.progress >= 0.45 && !canvasInReveal) {
            moveCanvasToReveal(reveal);
          } else if (self.progress < 0.45 && canvasInReveal) {
            restoreCanvas();
          }
        },
      },
    });

    // ─── Phase 1 (0 → 0.40): Text scrolls along the curved path ───
    tl.fromTo(
      textPath,
      { attr: { startOffset: "100%" } },
      {
        attr: { startOffset: isMobile ? "-150%" : "-100%" },
        duration: 0.40,
        ease: "none",
      },
      0,
    );

    // ─── Phase 2 (0.35 → 0.40): Small dot appears at text end position ───
    tl.fromTo(
      reveal,
      {
        clipPath: "circle(0% at 75% 40%)",
      },
      {
        clipPath: "circle(1.5% at 75% 40%)",
        duration: 0.05,
        ease: "power1.out",
      },
      0.35,
    );

    // ─── Phase 3 (0.40 → 0.45): Text fades out ───
    tl.to(
      svg,
      {
        opacity: 0,
        duration: 0.05,
        ease: "power1.in",
      },
      0.40,
    );

    // ─── Phase 4 (0.40 → 0.52): Dot moves down to center ───
    tl.to(
      reveal,
      {
        clipPath: "circle(1.5% at 50% 55%)",
        duration: 0.12,
        ease: "power2.inOut",
      },
      0.40,
    );

    // ─── Phase 5 (0.52 → 0.85): Dot expands to fill viewport ───
    tl.to(
      reveal,
      {
        clipPath: "circle(150% at 50% 55%)",
        duration: 0.33,
        ease: "power2.inOut",
      },
      0.52,
    );

    // ─── Phase 6 (0.55 → 0.70): Activate 3D contact scene ───
    tl.fromTo(
      sceneWeightsInOut.contact,
      { in: 0 },
      {
        in: 1,
        duration: 0.15,
        ease: "none",
      },
      0.55,
    );

    // ─── Phase 7 (0.68 → 0.80): Content fades in ───
    tl.to(
      revealContent,
      {
        opacity: 1,
        duration: 0.12,
        ease: "power1.out",
      },
      0.68,
    );

    // ─── Phase 7 (0.80): Wake up avatar animation ───
    tl.call(
      () => {
        avatarAnimations.wakeUp(0.25);
      },
      [],
      0.80,
    );
  });
};

const destroy = () => {
  // Always restore canvas before destroying
  restoreCanvas();

  // Reset contact scene weight
  sceneWeightsInOut.contact.in = 0;
  sceneWeightsInOut.contact.out = 0;

  if (scrollMm) {
    scrollMm.revert();
    scrollMm = null;
  }
};

export const nextSection = { setup, destroy };
