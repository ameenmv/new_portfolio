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
  const screenY = svgRect.top + ((svgY + 200) / 1300) * svgRect.height;
  return {
    x: ((screenX - containerRect.left) / containerRect.width) * 100,
    y: ((screenY - containerRect.top) / containerRect.height) * 100,
  };
};

// ─── Letter assembly helpers (DESKTOP ONLY) ───
interface CharInfo {
  el: SVGTSpanElement;
  yOffset: number;
  rotation: number;
  initRelDy: number;
  group: number; // 0 = cream (chaotic scatter), 1 = gradient (elegant cascade)
}

/**
 * Split textPath tspans into per-character tspans. (DESKTOP ONLY)
 * Group 0 (cream): chaotic random scatter (up/down + rotation)
 * Group 1 (gradient): elegant cascade from above (no rotation)
 */
const splitTextIntoChars = (textPath: SVGTextContentElement): CharInfo[] => {
  const originalTspans = Array.from(textPath.querySelectorAll("tspan"));
  const chars: CharInfo[] = [];

  const tspanInfos = originalTspans.map((ts) => ({
    text: ts.textContent || "",
    fill: ts.getAttribute("fill") || "",
  }));

  while (textPath.firstChild) {
    textPath.removeChild(textPath.firstChild);
  }

  // First pass: create tspans with group-specific offsets
  const absoluteOffsets: number[] = [];
  const rotationValues: number[] = [];
  const groups: number[] = [];
  let idx = 0;

  for (let g = 0; g < tspanInfos.length; g++) {
    const info = tspanInfos[g];
    if (!info) continue;

    for (let i = 0; i < info.text.length; i++) {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.textContent = info.text[i] ?? "";
      tspan.setAttribute("fill", info.fill);

      let yOffset: number;
      let rotation: number;

      if (g === 0) {
        // ─── Cream text: chaotic scatter (up/down + random rotation) ───
        const direction = idx % 2 === 0 ? -1 : 1;
        yOffset = direction * (300 + Math.random() * 400);
        rotation = (Math.random() - 0.5) * 90;
      } else {
        // ─── Gradient text: elegant cascade from above (no rotation) ───
        yOffset = -(400 + Math.random() * 300); // always from above
        rotation = 0; // clean, no rotation
      }

      absoluteOffsets.push(yOffset);
      rotationValues.push(rotation);
      groups.push(g);

      textPath.appendChild(tspan);
      idx++;
    }
  }

  // Second pass: convert absolute offsets to relative dy, set initial state
  const allTspans = Array.from(textPath.querySelectorAll("tspan"));
  for (let i = 0; i < allTspans.length; i++) {
    const tspan = allTspans[i];
    const absOffset = absoluteOffsets[i];
    const prevOffset = absoluteOffsets[i - 1];
    const rot = rotationValues[i];
    const group = groups[i];
    if (!tspan || absOffset === undefined || rot === undefined || group === undefined) continue;

    const relDy = i === 0 ? absOffset : absOffset - (prevOffset ?? 0);

    tspan.setAttribute("dy", relDy.toFixed(1));
    tspan.setAttribute("rotate", rot.toFixed(1));

    // Gradient chars start invisible for reveal effect
    if (group === 1) {
      tspan.setAttribute("opacity", "0");
    }

    chars.push({
      el: tspan,
      yOffset: absOffset,
      rotation: rot,
      initRelDy: relDy,
      group,
    });
  }

  return chars;
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

  // ─── PERF: Batch clip-path writes with rAF to avoid redundant style recalcs ───
  let pendingClipPath: string | null = null;
  let clipPathRafId: number | null = null;

  const flushClipPath = () => {
    if (pendingClipPath !== null) {
      reveal.style.clipPath = pendingClipPath;
      pendingClipPath = null;
    }
    clipPathRafId = null;
  };

  const setClipPath = (value: string) => {
    pendingClipPath = value;
    if (clipPathRafId === null) {
      clipPathRafId = requestAnimationFrame(flushClipPath);
    }
  };

  scrollMm = createMatchMedia((_context, { isMobile }) => {
    // ─── PERF: On mobile, skip per-character splitting entirely ───
    // SVG attribute animations (dy, rotate) force SVG re-layout every frame.
    // On mobile this is the #1 bottleneck. Instead, keep the original 2 tspans
    // and only animate startOffset + opacity (2 tweens vs 30+).
    const charInfos = isMobile ? [] : splitTextIntoChars(textPath);

    let lastPctX = 50;
    let lastPctY = 50;
    let positionCached = isMobile; // on mobile, skip SVG position queries entirely
    let wakeUpCalled = false;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom bottom",
        scrub: isMobile ? 2.5 : 1.5,
        onUpdate: (self) => {
          const p = tl.progress();
          const rawP = self.progress;

          // ─── Track the period (last char) position (DESKTOP ONLY) ───
          // On mobile: positionCached=true from init, so this block is skipped entirely.
          // On desktop: track continuously so the circle reveal follows the period as it scrolls.
          if (!positionCached && p >= 0.05 && p < 0.45) {
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

          // ─── Dot sizing: matches the period char, then expands ───
          const periodRadius = isMobile ? 1.2 : 0.9;

          if (p < 0.35) {
            setClipPath("circle(0% at 50% 55%)");
          } else if (p < 0.45) {
            setClipPath(`circle(${periodRadius}% at ${lastPctX}% ${lastPctY}%)`);
          } else if (p < 0.55) {
            const t = (p - 0.45) / 0.10;
            const eased = smoothstep(t);
            const r = periodRadius + eased * 1.5;
            setClipPath(`circle(${r}% at ${lastPctX}% ${lastPctY}%)`);
          } else if (p < 0.68) {
            const t = Math.min(1, (p - 0.55) / 0.13);
            const eased = smoothstep(t);
            const x = lastPctX + (50 - lastPctX) * eased;
            const y = lastPctY + (50 - lastPctY) * eased;
            const r = (periodRadius + 1.5) + eased * 6;
            setClipPath(`circle(${r}% at ${x}% ${y}%)`);
          } else {
            const t = Math.min(1, (p - 0.68) / 0.25);
            const eased = smoothstep(t);
            const r = (periodRadius + 7.5) + eased * 142;
            setClipPath(`circle(${r}% at 50% 50%)`);
          }

          // ─── Canvas reparenting ───
          if (rawP >= 0.15 && !canvasInReveal) {
            moveCanvasToReveal(reveal);
          } else if (rawP < 0.15 && canvasInReveal) {
            restoreCanvas();
          }

          // ─── Avatar wake up ───
          if (rawP >= 0.80 && !wakeUpCalled) {
            avatarAnimations.wakeUp();
            wakeUpCalled = true;
          } else if (rawP < 0.80) {
            wakeUpCalled = false;
          }
        },
      },
    });

    // ─── Letter assembly via GSAP (DESKTOP ONLY) ───
    if (!isMobile) {
      for (let i = 0; i < charInfos.length; i++) {
        const char = charInfos[i];
        if (!char) continue;

        const staggerDelay = (i / charInfos.length) * 0.06;

        if (char.group === 0) {
          tl.to(
            char.el,
            {
              attr: { dy: 0, rotate: 0 },
              duration: 0.18,
              ease: "power3.out",
            },
            0.04 + staggerDelay,
          );
        } else {
          tl.to(
            char.el,
            {
              attr: { dy: 0, opacity: 1 },
              duration: 0.18,
              ease: "power3.out",
            },
            0.04 + staggerDelay,
          );
        }
      }
    }

    // ─── Text scrolls along the curved path ───
    tl.fromTo(
      textPath,
      { attr: { startOffset: "75%" } },
      {
        attr: { startOffset: isMobile ? "-150%" : "-100%" },
        duration: 0.40,
        ease: "none",
      },
      0,
    );

    // ─── Text fades out ───
    tl.to(
      textEl,
      {
        opacity: 0,
        duration: 0.08,
        ease: "power1.in",
      },
      0.40,
    );

    // ─── Activate 3D contact scene ───
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

