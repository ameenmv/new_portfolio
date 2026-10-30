import { ref, watchEffect } from "vue";
import { lenis } from "./useScroll";
import { sizes } from "../utils/sizes";

export const useHeaderTheme = ({
  onUpdate,
}: {
  onUpdate?: (element: HTMLElement | null, boundingClientRect: DOMRect | null, hasScrolledIntoView: boolean) => void;
} = {}) => {
  let aboutElement: HTMLElement | null = null;
  let processElement: HTMLElement | null = null;
  const isDarkTheme = ref(false);
  const hasScrolledIntoView = ref(false);

  const handleScroll = () => {
    if (!aboutElement) {
      aboutElement = typeof window !== "undefined" ? document.querySelector("#about") : null;
    }

    if (!processElement) {
      processElement = typeof window !== "undefined" ? document.querySelector("#process") : null;
    }

    if (aboutElement) {
      const aboutBounding = aboutElement.getBoundingClientRect();
      const isLandscape = sizes.isLandscape;
      const isScrolledIntoView = aboutBounding.top - (isLandscape ? sizes.height * 0.225 : 0) < 0;
      const isScrolledPast = aboutBounding.bottom - 36 < 0;

      // the Process section has a dark background too
      const processBounding = processElement?.getBoundingClientRect();
      const isOverProcess = !!processBounding && processBounding.top < 36 && processBounding.bottom > 36;

      hasScrolledIntoView.value = isScrolledIntoView;
      isDarkTheme.value = (isScrolledIntoView && !isScrolledPast) || isOverProcess;

      if (typeof onUpdate === "function") {
        onUpdate(aboutElement, aboutBounding, isScrolledIntoView);
      }
    }
  };

  watchEffect((onInvalidate) => {
    if (lenis.value) {
      lenis.value.on("scroll", handleScroll);
    }

    onInvalidate(() => {
      if (lenis.value) {
        lenis.value.off("scroll", handleScroll);
      }
    });
  });

  return {
    isDarkTheme,
    hasScrolledIntoView,
  };
};
