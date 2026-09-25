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
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5,
        onUpdate: (self) => {
          // Move canvas into reveal when the circle starts expanding
          if (self.progress >= 0.50 && !canvasInReveal) {
            moveCanvasToReveal(reveal);
          } else if (self.progress < 0.50 && canvasInReveal) {
            restoreCanvas();
          }
        },
      },
    });

    // ─── Phase 1 (0 → 0.50): Text scrolls along the curved path ───
    tl.fromTo(
      textPath,
      { attr: { startOffset: "100%" } },
      {
        attr: { startOffset: isMobile ? "-150%" : "-100%" },
        duration: 0.50,
        ease: "none",
      },
      0,
    );

    // ─── Phase 2 (0.45 → 0.50): Small circle appears ───
    tl.to(
      reveal,
      {
        clipPath: "circle(2% at 50% 55%)",
        duration: 0.05,
        ease: "power1.out",
      },
      0.45,
    );

    // ─── Phase 3 (0.50 → 0.55): SVG text fades out ───
    tl.to(
      svg,
      {
        opacity: 0,
        duration: 0.05,
        ease: "power1.in",
      },
      0.50,
    );

    // ─── Phase 4 (0.55 → 0.90): Circle expands to fill viewport ───
    tl.to(
      reveal,
      {
        clipPath: "circle(150% at 50% 55%)",
        duration: 0.35,
        ease: "power2.inOut",
      },
      0.55,
    );

    // ─── Phase 5 (0.60 → 0.75): Activate 3D contact scene ───
    // This drives sceneWeightsInOut.contact.in from 0 → 1
    // which tells the camera to move to the contact character position
    tl.fromTo(
      sceneWeightsInOut.contact,
      { in: 0 },
      {
        in: 1,
        duration: 0.15,
        ease: "none",
      },
      0.60,
    );

    // ─── Phase 6 (0.72 → 0.85): Content fades in when circle is large ───
    tl.to(
      revealContent,
      {
        opacity: 1,
        duration: 0.13,
        ease: "power1.out",
      },
      0.72,
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
