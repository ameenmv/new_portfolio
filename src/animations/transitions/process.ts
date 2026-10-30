import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { createMatchMedia } from "../utils/matchMedia";
import { processScene, processState } from "../../three/process";
import { lenis } from "../../composables/useScroll";

gsap.registerPlugin(ScrollTrigger);

export const PROCESS_STEPS = 4;

// Timeline layout (0..1 of the pinned scroll):
// a short intro hold, then each step = morph (0.12) + hold
const MORPH_DURATION = 0.12;
const MORPH_STARTS = [0.06, 0.31, 0.56, 0.81];
// where each step reads best, used for the step navigation
const STEP_ANCHORS = [0, 0.22, 0.47, 0.72, 0.97];
// the shape turns a little on every morph so it feels like a camera move
const STEP_ROTATIONS = [-0.35, 0.25, -0.25, 0];

let mm: gsap.MatchMedia | null = null;
let mainTrigger: ScrollTrigger | null = null;

type Callbacks = {
  onStep: (step: number) => void;
  onProgress: (progress: number) => void;
};

const setup = (section: HTMLElement, { onStep, onProgress }: Callbacks) => {
  let currentStep = -1;

  const updateStep = () => {
    // switch the copy when the particles are halfway into the next shape
    const step = Math.min(PROCESS_STEPS, Math.floor(processState.morph + 0.5));
    if (step !== currentStep) {
      currentStep = step;
      onStep(step);
    }
  };

  mm = createMatchMedia((_context, { isMobile }) => {
    // render only while any part of the section is on screen
    ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => processScene.setActive(self.isActive),
    });

    // ─── Enter: the scattered cloud gathers into a galaxy ───
    gsap.fromTo(
      processState,
      { intro: 0 },
      {
        intro: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      },
    );

    // ─── Pinned journey through the four steps ───
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      // the timeline's own onUpdate keeps firing while scrub catches up after scrolling stops
      onUpdate: () => {
        onProgress(tl.progress());
        updateStep();
      },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: isMobile ? 1.2 : 0.9,
      },
    });
    mainTrigger = tl.scrollTrigger ?? null;

    tl.set(processState, { morph: 0, rotation: 0, warp: 0 }, 0);

    MORPH_STARTS.forEach((start, index) => {
      tl.to(processState, { morph: index + 1, duration: MORPH_DURATION, ease: "power1.inOut" }, start);
      tl.to(processState, { rotation: STEP_ROTATIONS[index], duration: MORPH_DURATION * 1.6, ease: "power2.inOut" }, start);
    });

    // launch: the star field speeds up with the rocket
    tl.to(processState, { warp: 1, duration: 0.1, ease: "power2.in" }, MORPH_STARTS[3]! + MORPH_DURATION * 0.6);
    // pad the end so the last hold keeps its length
    tl.set({}, {}, 1);

    // ─── Exit: blast the particles apart as Projects slides in ───
    gsap.fromTo(
      processState,
      { explode: 0 },
      {
        explode: 1,
        ease: "power2.in",
        scrollTrigger: {
          trigger: section,
          start: "bottom bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );

    return () => {
      mainTrigger = null;
      processScene.setActive(false);
    };
  });
};

/** Smooth-scrolls to the point where a given step is fully formed. */
const scrollToStep = (step: number) => {
  if (!mainTrigger || !lenis.value) return;
  const anchor = STEP_ANCHORS[Math.max(0, Math.min(step, STEP_ANCHORS.length - 1))]!;
  const target = mainTrigger.start + (mainTrigger.end - mainTrigger.start) * anchor;
  lenis.value.scrollTo(target, { duration: 1.6 });
};

const destroy = () => {
  mm?.revert();
  mm = null;
  mainTrigger = null;
  Object.assign(processState, { morph: 0, intro: 0, explode: 0, warp: 0, rotation: 0 });
};

export const processTransition = { setup, destroy, scrollToStep };
