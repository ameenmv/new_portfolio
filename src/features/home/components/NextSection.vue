<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { nextSection } from "../../../animations/transitions/next-section";
import { t } from "../../../i18n/utils/translate";
import Social from "../../../components/Social.vue";

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
      <!-- Kinetic SVG text on curved path -->
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

      <!-- Circular reveal: Contact section appears from inside the expanding circle -->
      <div class="next-section__reveal">
        <div class="next-section__reveal-content">
          <div class="next-section__reveal-inner">
            <h2 class="next-section__reveal-title" v-html="t('lets-work-together')"></h2>
            <Social variant="background" />
          </div>
        </div>
      </div>
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

  // ─── Circular reveal overlay ───
  &__reveal {
    position: absolute;
    inset: 0;
    background: var(--color-black-400);
    clip-path: circle(0% at 50% 55%);
    z-index: 2;
    will-change: clip-path;
  }

  &__reveal-content {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: var(--space-md);
    max-width: calc(var(--breakpoint-xxxl));
    margin: 0 auto;
    padding: var(--space-outer);
    padding-top: var(--space-lg);
    align-content: start;

    @include mixins.mq("md") {
      gap: var(--space-xl);
      padding-top: var(--space-xxl);
    }
  }

  &__reveal-inner {
    position: relative;
    padding-top: var(--space-md);
    grid-column: 1 / 13;
    display: flex;
    flex-direction: column;
    gap: var(--space-md);

    @include mixins.mq("sm") {
      grid-column: 1 / 8;
    }

    @include mixins.mq("md") {
      gap: var(--space-xl);
      grid-column: 1 / 6;
      padding-top: var(--space-lg);
    }

    @include mixins.mq("lg") {
      grid-column: 2 / 6;
    }
  }

  &__reveal-title {
    font-weight: 900;
    letter-spacing: 0.02em;
    font-size: var(--font-size-title-md);
    color: var(--color-beige-400);

    @include mixins.mq("sm") {
      font-size: var(--font-size-title-lg);
    }

    @include mixins.mq("xl") {
      font-size: var(--font-size-title-xl);
    }
  }
}
</style>
