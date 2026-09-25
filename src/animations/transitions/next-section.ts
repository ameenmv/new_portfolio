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

const smoothstep = (t: number) => t * t * (3 - 2 * t);

// Convert SVG text-end position to container percentage coordinates
const svgToContainerPct = (
  svgEl: SVGSVGElement,
  container: HTMLElement,
  svgX: number,
  svgY: number,
): { x: number; y: number } => {
  const svgRect = svgEl.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const screenX = svgRect.left + (svgX / 3900) * svgRect.width;
  const screenY = svgRect.top + (svgY / 900) * svgRect.height;
  return {
    x: ((screenX - containerRect.left) / containerRect.width) * 100,
    y: ((screenY - containerRect.top) / containerRect.height) * 100,
  };
};

const setup = (section: HTMLElement) => {
  const textPath = section.querySelector("#nextTextPath") as SVGTextContentElement;
  const textEl = section.querySelector(".next-section__svg text") as SVGTextElement;
  const svg = section.querySelector(".next-section__svg") as SVGSVGElement;
  const reveal = section.querySelector(".next-section__reveal") as HTMLElement;
  const revealContent = section.querySelector(".next-section__reveal-content") as HTMLElement;
  const container = section.querySelector(".next-section__container") as HTMLElement;

  if (!textPath || !textEl || !svg || !reveal || !revealContent || !container) {
    console.warn("[next-section] Required elements not found");
    return;
  }

  // Last known text-end position as container percentages
  let lastPctX = 50;
  let lastPctY = 50;
  let wakeUpCalled = false;

  scrollMm = createMatchMedia((_context, { isMobile }) => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = self.progress;

          // ─── Track text end position ───
          if (p >= 0.10 && p < 0.42) {
            try {
              const nChars = textPath.getNumberOfChars();
              if (nChars > 0) {
                const endPos = textPath.getEndPositionOfChar(nChars - 1);
                const pct = svgToContainerPct(svg, container, endPos.x, endPos.y);
                lastPctX = pct.x;
                lastPctY = pct.y;
              }
            } catch { /* skip */ }
          }

          // ─── ONE clip-path for everything ───
          if (p < 0.20) {
            // Not visible yet
            reveal.style.clipPath = "circle(0% at 50% 55%)";
          } else if (p < 0.42) {
            // Dot follows text end
            reveal.style.clipPath = `circle(1.5% at ${lastPctX}% ${lastPctY}%)`;
          } else if (p < 0.55) {
            // Dot moves to center and grows
            const t = Math.min(1, (p - 0.42) / 0.13);
            const eased = smoothstep(t);
            const x = lastPctX + (50 - lastPctX) * eased;
            const y = lastPctY + (55 - lastPctY) * eased;
            const r = 1.5 + eased * 5;
            reveal.style.clipPath = `circle(${r}% at ${x}% ${y}%)`;
          } else {
            // Full expansion
            const t = Math.min(1, (p - 0.55) / 0.30);
            const eased = smoothstep(t);
            const r = 6.5 + eased * 143.5;
            reveal.style.clipPath = `circle(${r}% at 50% 55%)`;
          }

          // ─── Canvas reparenting (before dot appears!) ───
          if (p >= 0.15 && !canvasInReveal) {
            moveCanvasToReveal(reveal);
          } else if (p < 0.15 && canvasInReveal) {
            restoreCanvas();
          }

          // ─── Avatar wake up ───
          if (p >= 0.80 && !wakeUpCalled) {
            avatarAnimations.wakeUp(0.25);
            wakeUpCalled = true;
          } else if (p < 0.80) {
            wakeUpCalled = false;
          }
        },
      },
    });

    // ─── Text scrolls along the curved path ───
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

    // ─── Text fades out (only text element) ───
    tl.to(
      textEl,
      {
        opacity: 0,
        duration: 0.05,
        ease: "power1.in",
      },
      0.40,
    );

    // ─── Activate 3D contact scene (early, before circle shows) ───
    tl.fromTo(
      sceneWeightsInOut.contact,
      { in: 0 },
      {
        in: 1,
        duration: 0.10,
        ease: "none",
      },
      0.15,
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
