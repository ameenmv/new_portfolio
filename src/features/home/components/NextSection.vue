<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { nextSection } from "../../../animations/transitions/next-section";
import { t } from "../../../i18n/utils/translate";

const sectionRef = ref<HTMLElement | null>(null);

onMounted(() => {
  if (sectionRef.value) {
    nextSection.setup(sectionRef.value);
  }
});

onUnmounted(() => {
  nextSection.destroy();
});
</script>

<template>
  <section class="next-section" ref="sectionRef" id="next">
    <div class="next-section__container">
      <svg
        class="next-section__svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 3900 900"
        overflow="visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="nextTextGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="70%" stop-color="#f6c177" />
            <stop offset="82%" stop-color="#ff8400" />
            <stop offset="90%" stop-color="#e8825c" />
            <stop offset="100%" stop-color="#34bfff" />
          </linearGradient>

          <path
            id="nextCurvePath"
            d="M0 611 C175 378 857 -285 1461 140 C1912 456 2114 806 2679 611 C3088 470 3705 -33 4355 782 C4701 1215 5306 1467 6108 329"
            fill="none"
          />
        </defs>

        <text
          font-family="Urbanist, sans-serif"
          font-weight="900"
          font-size="280"
          letter-spacing="0.02em"
        >
          <textPath
            id="nextTextPath"
            href="#nextCurvePath"
            startOffset="100%"
          ><tspan fill="#f5efe6">{{ t('next-text-cream') }}</tspan><tspan fill="url(#nextTextGrad)">{{ t('next-text-gradient') }}</tspan></textPath>
        </text>
      </svg>

      <!-- The expanding orb that reveals the contact section -->
      <div class="next-section__orb"></div>
    </div>
  </section>
</template>

<style lang="scss">
.next-section {
  position: relative;
  width: 100%;
  height: 500vh;
  background: var(--color-black-400);
  z-index: 1;

  &__container {
    position: sticky;
    top: 0;
    width: 100%;
    height: calc(var(--lvh) * 100);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    will-change: transform, opacity;
  }

  &__svg {
    max-inline-size: none !important;
    block-size: auto !important;
    width: 400vw;
    min-width: 400vw;
    height: auto;
    pointer-events: none;
    user-select: none;

    @include mixins.mq("md") {
      width: 350vw;
      min-width: 350vw;
    }

    @include mixins.mq("xl") {
      width: 300vw;
      min-width: 300vw;
    }
  }

  &__orb {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ff8400;
    left: 50%;
    top: 50%;
    margin-left: -20px;
    margin-top: -20px;
    opacity: 0;
    will-change: transform;
    z-index: 2;
  }
}
</style>
