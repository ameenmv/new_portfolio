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

  canvasOriginalParent = canvas.parentElement;
  canvasOriginalNextSibling = canvas.nextSibling;

  reveal.insertBefore(canvas, reveal.firstChild);
  canvas.classList.add("three-canvas-in-reveal");
  window.dispatchEvent(new Event("resize"));
  canvasInReveal = true;
};

const restoreCanvas = () => {
  const canvas = document.querySelector(".three-canvas") as HTMLElement;
  if (!canvas || !canvasOriginalParent || !canvasInReveal) return;

  if (canvasOriginalNextSibling && canvasOriginalNextSibling.parentNode === canvasOriginalParent) {
    canvasOriginalParent.insertBefore(canvas, canvasOriginalNextSibling);
  } else {
    canvasOriginalParent.appendChild(canvas);
  }

  canvas.classList.remove("three-canvas-in-reveal");
  canvasInReveal = false;
};

// Smoothstep easing
const smoothstep = (t: number) => t * t * (3 - 2 * t);

const setup = (section: HTMLElement) => {
  const textPath = section.querySelector("#nextTextPath") as SVGTextContentElement;
  const svg = section.querySelector(".next-section__svg") as SVGSVGElement;
  const svgDot = section.querySelector("#nextDot") as SVGCircleElement;
  const reveal = section.querySelector(".next-section__reveal") as HTMLElement;
  const revealContent = section.querySelector(".next-section__reveal-content") as HTMLElement;
  const container = section.querySelector(".next-section__container") as HTMLElement;

  if (!textPath || !svg || !svgDot || !reveal || !revealContent || !container) {
    console.warn("[next-section] Required elements not found");
    return;
  }

  // SVG viewBox center for "move to center" animation
  const viewBoxCenterX = 1950; // 3900 / 2
  const viewBoxCenterY = 495;  // 900 * 0.55

  // Last known dot position in SVG coordinates
  let lastDotSvgX = 0;
  let lastDotSvgY = 0;

  scrollMm = createMatchMedia((_context, { isMobile }) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;

          // ─── SVG Dot: track text end position ───
          if (p >= 0.10 && p < 0.42) {
            try {
              const nChars = textPath.getNumberOfChars();
              if (nChars > 0) {
                const endPos = textPath.getEndPositionOfChar(nChars - 1);
                lastDotSvgX = endPos.x;
                lastDotSvgY = endPos.y;

                // Position the SVG circle directly (same coordinate system!)
                svgDot.setAttribute("cx", String(endPos.x));
                svgDot.setAttribute("cy", String(endPos.y));
              }
            } catch {
              // silently fail if chars not available
            }
          }

          // ─── SVG Dot: move to center after text fades ───
          if (p >= 0.42 && p < 0.52) {
            const t = Math.min(1, (p - 0.42) / 0.08);
            const eased = smoothstep(t);
            const x = lastDotSvgX + (viewBoxCenterX - lastDotSvgX) * eased;
            const y = lastDotSvgY + (viewBoxCenterY - lastDotSvgY) * eased;
            svgDot.setAttribute("cx", String(x));
            svgDot.setAttribute("cy", String(y));

            // Grow the dot as it moves to center
            const r = 18 + t * 30;
            svgDot.setAttribute("r", String(r));
          }

          // ─── SVG Dot: visibility ───
          if (p >= 0.18 && p < 0.52) {
            svgDot.setAttribute("opacity", "1");
          } else {
            svgDot.setAttribute("opacity", "0");
            svgDot.setAttribute("r", "18");
          }

          // ─── Canvas reparenting ───
          if (p >= 0.45 && !canvasInReveal) {
            moveCanvasToReveal(reveal);
          } else if (p < 0.45 && canvasInReveal) {
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

    // ─── Phase 2 (0.40 → 0.45): Text fades out ───
    tl.to(
      svg,
      {
        opacity: 0,
        duration: 0.05,
        ease: "power1.in",
      },
      0.40,
    );

    // ─── Phase 3 (0.52 → 0.85): Clip-path reveal expands from center ───
    tl.fromTo(
      reveal,
      { clipPath: "circle(1% at 50% 55%)" },
      {
        clipPath: "circle(150% at 50% 55%)",
        duration: 0.33,
        ease: "power2.inOut",
      },
      0.52,
    );

    // ─── Phase 4 (0.55 → 0.70): Activate 3D contact scene ───
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

    // ─── Phase 5 (0.68 → 0.80): Content fades in ───
    tl.to(
      revealContent,
      {
        opacity: 1,
        duration: 0.12,
        ease: "power1.out",
      },
      0.68,
    );

    // ─── Phase 6 (0.80): Wake up avatar animation ───
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
  restoreCanvas();
  sceneWeightsInOut.contact.in = 0;
  sceneWeightsInOut.contact.out = 0;

  if (scrollMm) {
    scrollMm.revert();
    scrollMm = null;
  }
};

export const nextSection = { setup, destroy };
