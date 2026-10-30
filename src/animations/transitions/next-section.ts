import gsap from "gsap";
import { createMatchMedia } from "../utils/matchMedia";
import { sceneWeightsInOut } from "../scenes";
import { animations as avatarAnimations } from "../../three/objects/avatar/animations";
import { PAPER_PHASES, paperPlane, paperState } from "../../three/paper-plane";

let scrollMm: gsap.MatchMedia | null = null;
let canvasOriginalParent: HTMLElement | null = null;
let canvasOriginalNextSibling: Node | null = null;
let canvasInReveal = false;

export type PaperStage = "write" | "fold" | "send" | "arrive";

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

const stageAt = (p: number): PaperStage =>
  p < PAPER_PHASES.fold ? "write" : p < PAPER_PHASES.send ? "fold" : p < PAPER_PHASES.arrive ? "send" : "arrive";

type Callbacks = {
  onStage: (stage: PaperStage) => void;
  onDelivered: (delivered: boolean) => void;
};

const setup = (section: HTMLElement, { onStage, onDelivered }: Callbacks) => {
  const reveal = section.querySelector(".next-section__reveal") as HTMLElement;
  const paperCanvas = section.querySelector(".next-section__paper") as HTMLElement;

  if (!reveal || !paperCanvas) {
    console.warn("[next-section] Required elements not found");
    return;
  }

  scrollMm = createMatchMedia((_context, { isMobile }) => {
    let wakeUpCalled = false;
    let stage: PaperStage | null = null;
    let delivered: boolean | null = null;

    // ─── Render the paper scene only while the section is on screen ───
    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => paperPlane.setActive(self.isActive),
      },
    });

    // ─── The letter slides up into view ───
    gsap.fromTo(
      paperState,
      { enter: 0 },
      {
        enter: 1,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true },
      },
    );

    // ─── Write → fold → send → arrive ───
    gsap.fromTo(
      paperState,
      { progress: 0 },
      {
        progress: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: isMobile ? 1.6 : 1.2,
        },
        // runs while scrub catches up too, not only while scrolling
        onUpdate: () => {
          const p = paperState.progress;

          const next = stageAt(p);
          if (next !== stage) {
            stage = next;
            onStage(next);
          }

          // the unfolded sheet hands over to the real contact layer underneath
          const isDelivered = p >= PAPER_PHASES.handoff;
          if (isDelivered !== delivered) {
            delivered = isDelivered;
            // clip-path (not visibility) so the main 3D canvas inside stays hidden too
            reveal.style.clipPath = isDelivered ? "none" : "inset(0 0 100% 0)";
            paperCanvas.style.visibility = isDelivered ? "hidden" : "visible";
            onDelivered(isDelivered);
          }

          // ─── Avatar wakes up as the message lands ───
          if (isDelivered && !wakeUpCalled) {
            avatarAnimations.wakeUp();
            wakeUpCalled = true;
          } else if (p < PAPER_PHASES.arrive) {
            wakeUpCalled = false;
          }
        },
      },
    );

    // ─── Main 3D canvas joins the contact layer; activate the contact scene ───
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          if (self.progress >= 0.15 && !canvasInReveal) {
            moveCanvasToReveal(reveal);
          } else if (self.progress < 0.15 && canvasInReveal) {
            restoreCanvas();
          }
        },
      },
    });
    tl.fromTo(sceneWeightsInOut.contact, { in: 0 }, { in: 1, duration: 0.1, ease: "none" }, 0.15);
    tl.set({}, {}, 1);

    return () => {
      paperPlane.setActive(false);
      reveal.style.clipPath = "";
      paperCanvas.style.visibility = "";
    };
  });
};

const destroy = () => {
  restoreCanvas();
  sceneWeightsInOut.contact.in = 0;
  sceneWeightsInOut.contact.out = 0;
  paperState.enter = 0;
  paperState.progress = 0;

  if (scrollMm) {
    scrollMm.revert();
    scrollMm = null;
  }
};

export const nextSection = { setup, destroy };
