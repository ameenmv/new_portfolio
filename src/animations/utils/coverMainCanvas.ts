import { ScrollTrigger } from "gsap/ScrollTrigger";
import { renderer } from "../../three/core/renderer";

/**
 * PERF: while an opaque section fills the whole screen the fixed 3D canvas behind it is invisible,
 * so skip rendering it. On phones that frees the GPU for the section's own effects.
 */
export const coverMainCanvas = (section: HTMLElement, reason: string) => {
  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    onToggle: (self) => renderer.setSuspended(reason, self.isActive),
  });

  return {
    kill: () => {
      trigger.kill();
      renderer.setSuspended(reason, false);
    },
  };
};
