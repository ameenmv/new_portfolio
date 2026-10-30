<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import Banner from "../../../components/Banner.vue";
import NotchSection from "../../../components/NotchSection.vue";
import { t } from "../../../i18n/utils/translate";
import { processScene } from "../../../three/process";
import { PROCESS_STEPS, processTransition } from "../../../animations/transitions/process";
import { projectVisible } from "../../../composables/useRouteObserver";

const sectionRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const activeStep = ref(0);

const steps = computed(() =>
  Array.from({ length: PROCESS_STEPS }, (_, i) => {
    const index = i + 1;
    const title = t(`process-${index}-title`);
    return {
      index,
      title,
      chars: Array.from(title),
      description: t(`process-${index}-description`),
      tags: t(`process-${index}-tags`).split("|").filter(Boolean),
    };
  }),
);

const stateClass = (index: number) => ({
  "is-active": activeStep.value === index,
  "is-past": activeStep.value > index,
});

watch(projectVisible, (visible) => processScene.setPaused(visible), { immediate: true });

onMounted(() => {
  if (!sectionRef.value || !canvasRef.value) return;

  processScene.init(canvasRef.value);
  processTransition.setup(sectionRef.value, {
    onStep: (step) => {
      activeStep.value = step;
    },
    // written straight to CSS to avoid a Vue render per scroll frame
    onProgress: (progress) => {
      sectionRef.value?.style.setProperty("--process-progress", progress.toFixed(4));
    },
  });
});

onUnmounted(() => {
  processTransition.destroy();
  processScene.destroy();
});
</script>

<template>
  <section class="process" id="process" ref="sectionRef">
    <NotchSection class="process-notch" />

    <div class="process-sticky">
      <canvas class="process-canvas" ref="canvasRef"></canvas>

      <!-- giant rolling step number -->
      <div class="process-number" :class="{ 'is-visible': activeStep > 0 }" aria-hidden="true">
        <span>0</span>
        <span class="process-number-window">
          <span class="process-number-strip" :style="{ transform: `translateY(${-activeStep * 100}%)` }">
            <span v-for="n in PROCESS_STEPS + 1" :key="n">{{ n - 1 }}</span>
          </span>
        </span>
      </div>

      <div class="process-ui">
        <header class="process-head">
          <Banner class="process-head-banner" :copy="t('process-banner')" size="sm" animated />
          <h2 class="process-head-title">{{ t("process") }}</h2>
        </header>

        <div class="process-steps">
          <div class="process-step process-step-intro" :class="stateClass(0)">
            <p class="process-intro">{{ t("process-intro") }}</p>
            <span class="process-hint">
              <span class="process-hint-line"></span>
              {{ t("process-scroll") }}
            </span>
          </div>

          <article
            v-for="step in steps"
            :key="step.index"
            class="process-step"
            :class="stateClass(step.index)"
            :aria-hidden="activeStep !== step.index"
          >
            <div class="process-step-index">
              <span class="process-step-index-current">0{{ step.index }}</span>
              <span class="process-step-index-line"></span>
              <span>0{{ PROCESS_STEPS }}</span>
            </div>
            <h3 class="process-step-title" :aria-label="step.title">
              <span
                v-for="(char, i) in step.chars"
                :key="`${char}-${i}`"
                class="process-char"
                :style="{ '--i': i }"
                aria-hidden="true"
                >{{ char === " " ? " " : char }}</span
              >
            </h3>
            <p class="process-step-description">{{ step.description }}</p>
            <ul class="process-step-tags">
              <li v-for="(tag, i) in step.tags" :key="tag" :style="{ '--i': i }">{{ tag }}</li>
            </ul>
          </article>
        </div>

        <nav class="process-nav" :aria-label="t('process')">
          <button
            v-for="step in steps"
            :key="step.index"
            type="button"
            class="process-nav-item"
            :class="{ 'is-active': activeStep === step.index, 'is-done': activeStep > step.index }"
            :aria-current="activeStep === step.index ? 'step' : undefined"
            :aria-label="`${t('go-to')} ${step.title}`"
            @click="processTransition.scrollToStep(step.index)"
          >
            <span class="process-nav-label">{{ step.title }}</span>
            <span class="process-nav-dot"></span>
          </button>
        </nav>

        <div class="process-progress" aria-hidden="true">
          <div class="process-progress-bar"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

.process {
  --process-progress: 0;
  --process-cream: var(--color-beige-400);
  --process-muted: rgba(245, 239, 230, 0.55);
  --process-line: rgba(245, 239, 230, 0.14);

  position: relative;
  z-index: 1;
  width: 100%;
  height: calc(var(--lvh) * 450);
  background: var(--color-black-400);
  color: var(--process-cream);

  @include mixins.mq("md") {
    height: calc(var(--lvh) * 600);
  }
}

.process-notch {
  position: absolute;
  top: 0;
  left: 0;
  transform: translateY(-100%);
  color: var(--color-black-400);
  --icon-color: var(--color-black-400);
}

.process-sticky {
  position: sticky;
  top: 0;
  width: 100%;
  height: calc(var(--lvh) * 100);
  overflow: hidden;
  contain: layout paint;
}

.process-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.process-ui {
  position: absolute;
  inset: 0;
  padding: 0 var(--space-outer);
  pointer-events: none;
}

/* ───────────── Heading ───────────── */
.process-head {
  position: absolute;
  top: calc(var(--height-header) + var(--space-lg));
  left: var(--space-outer);
  padding-top: var(--space-md);

  &-banner {
    position: absolute;
    top: 0;
    left: -8px;
    transform: translate(0, -20%) rotate(-4deg);
    z-index: 1;
  }

  &-title {
    font-weight: 900;
    letter-spacing: 0.02em;
    line-height: var(--line-height-title);
    font-size: var(--font-size-title-md);

    @include mixins.mq("md") {
      font-size: var(--font-size-title-lg);
    }
  }
}

/* ───────────── Rolling number ───────────── */
.process-number {
  position: absolute;
  display: flex;
  right: -2vw;
  top: calc(var(--height-header) + 2vh);
  font-size: 34vw;
  font-weight: 900;
  line-height: 0.8;
  letter-spacing: -0.04em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(245, 239, 230, 0.09);
  opacity: 0;
  transform: translateY(8%);
  transition:
    opacity 1s ease,
    transform 1.2s $ease-out-expo;
  user-select: none;

  @include mixins.mq("md") {
    top: auto;
    bottom: -6vw;
    right: 2vw;
    font-size: 28vw;
  }

  &.is-visible {
    opacity: 1;
    transform: none;
  }

  &-window {
    display: inline-block;
    height: 0.8em;
    overflow: hidden;
  }

  &-strip {
    display: flex;
    flex-direction: column;
    transition: transform 1.1s $ease-out-expo;

    span {
      height: 0.8em;
    }
  }
}

/* ───────────── Steps ───────────── */
.process-steps {
  position: absolute;
  left: var(--space-outer);
  right: var(--space-outer);
  bottom: calc(var(--space-outer) + 64px);
  height: 250px;

  @include mixins.mq("md") {
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(40vw, 560px);
    height: 380px;
    transform: translateY(-40%);
  }
}

.process-step {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--space-md);

  @include mixins.mq("md") {
    justify-content: center;
    gap: var(--space-lg);
  }

  &-index {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-family: "ProFontWindows", monospace;
    font-size: var(--font-size-md);
    color: var(--process-muted);
    opacity: 0;
    transform: translateX(-12px);
    transition:
      opacity 0.4s ease,
      transform 0.6s $ease-out-expo;

    &-current {
      color: var(--color-orange-400);
    }

    &-line {
      width: 48px;
      height: 1px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.8s $ease-out-expo;
    }
  }

  &-title {
    display: flex;
    flex-wrap: wrap;
    overflow: hidden;
    padding-bottom: 0.08em;
    font-weight: 900;
    letter-spacing: 0.01em;
    line-height: 1;
    font-size: var(--font-size-title-lg);

    @include mixins.mq("md") {
      font-size: clamp(64px, 7vw, 112px);
    }
  }

  &-description {
    max-width: 460px;
    font-size: var(--font-size-md);
    line-height: var(--line-height-copy);
    color: var(--process-muted);
    opacity: 0;
    filter: blur(8px);
    transform: translateY(20px);
    transition:
      opacity 0.5s ease,
      filter 0.5s ease,
      transform 0.6s $ease-out-expo;

    @include mixins.mq("md") {
      font-size: var(--font-size-lg);
    }
  }

  &-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      padding: 6px 14px;
      border: 1px solid var(--process-line);
      border-radius: 100px;
      font-size: var(--font-size-sm);
      font-weight: 700;
      letter-spacing: 0.02em;
      opacity: 0;
      transform: translateY(12px) scale(0.92);
      transition:
        opacity 0.3s ease,
        transform 0.4s ease;
    }
  }

  /* active: everything flows in, staggered */
  &.is-active {
    .process-step-index {
      opacity: 1;
      transform: none;
      transition-delay: 0.05s;
    }

    .process-step-index-line {
      transform: scaleX(1);
      transition-delay: 0.15s;
    }

    .process-char {
      opacity: 1;
      transform: none;
      transition:
        transform 1s $ease-out-expo calc(0.1s + var(--i) * 40ms),
        opacity 0.6s ease calc(0.1s + var(--i) * 40ms);
    }

    .process-step-description {
      opacity: 1;
      filter: none;
      transform: none;
      transition:
        opacity 0.8s ease 0.35s,
        filter 0.8s ease 0.35s,
        transform 1s $ease-out-expo 0.35s;
    }

    .process-step-tags li {
      opacity: 1;
      transform: none;
      transition:
        opacity 0.6s ease calc(0.55s + var(--i) * 90ms),
        transform 0.9s $ease-out-expo calc(0.55s + var(--i) * 90ms);
    }
  }

  /* past: exits upward instead of downward */
  &.is-past .process-char {
    transform: translateY(-110%) rotate(-8deg);
    transition:
      transform 0.45s ease-in calc(var(--i) * 15ms),
      opacity 0.3s ease calc(var(--i) * 15ms);
  }
}

.process-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(110%) rotate(8deg);
  transform-origin: left bottom;
  transition:
    transform 0.45s ease-in calc(var(--i) * 15ms),
    opacity 0.3s ease calc(var(--i) * 15ms);
}

/* intro copy shown before the first step */
.process-step-intro {
  .process-intro {
    max-width: 480px;
    font-size: var(--font-size-title-xs);
    font-weight: 700;
    line-height: var(--line-height-title);
    opacity: 0;
    filter: blur(10px);
    transform: translateY(24px);
    transition:
      opacity 0.5s ease,
      filter 0.5s ease,
      transform 0.6s ease;

    @include mixins.mq("md") {
      font-size: var(--font-size-title-sm);
    }
  }

  .process-hint {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    font-size: var(--font-size-sm);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--process-muted);
    opacity: 0;
    transition: opacity 0.4s ease;

    &-line {
      position: relative;
      width: 40px;
      height: 1px;
      overflow: hidden;
      background: var(--process-line);

      &::after {
        content: "";
        position: absolute;
        inset: 0;
        background: var(--color-orange-400);
        animation: process-hint 1.8s ease-in-out infinite;
      }
    }
  }

  &.is-active {
    .process-intro {
      opacity: 1;
      filter: none;
      transform: none;
      transition:
        opacity 0.9s ease 0.2s,
        filter 0.9s ease 0.2s,
        transform 1.1s $ease-out-expo 0.2s;
    }

    .process-hint {
      opacity: 1;
      transition-delay: 0.6s;
    }
  }
}

@keyframes process-hint {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* ───────────── Step navigation ───────────── */
.process-nav {
  position: absolute;
  left: var(--space-outer);
  bottom: calc(var(--space-outer) + 20px);
  display: flex;
  gap: var(--space-sm);
  pointer-events: auto;

  @include mixins.mq("md") {
    left: auto;
    bottom: auto;
    right: var(--space-outer);
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
    align-items: flex-end;
    gap: var(--space-md);
  }

  &-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: 6px 0;
    border: none;
    background: none;
    color: var(--process-muted);
    font: inherit;
    font-size: var(--font-size-sm);
    font-weight: 700;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: color 0.3s ease;

    &:hover,
    &:focus-visible,
    &.is-active {
      color: var(--process-cream);
    }

    &:focus-visible {
      outline: 1px solid var(--color-orange-400);
      outline-offset: 4px;
      border-radius: 4px;
    }
  }

  &-label {
    display: none;
    opacity: 0;
    transform: translateX(8px);
    transition:
      opacity 0.3s ease,
      transform 0.4s $ease-out-expo;

    @include mixins.mq("md") {
      display: inline;
    }
  }

  &-item:hover &-label,
  &-item.is-active &-label {
    opacity: 1;
    transform: none;
  }

  &-dot {
    position: relative;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid currentColor;
    transition:
      background-color 0.3s ease,
      border-color 0.3s ease,
      transform 0.4s $ease-out-expo;

    &::after {
      content: "";
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      border: 1px solid var(--color-orange-400);
      opacity: 0;
      transform: scale(0.4);
      transition:
        opacity 0.3s ease,
        transform 0.5s $ease-out-expo;
    }
  }

  &-item.is-done &-dot {
    background: currentColor;
  }

  &-item.is-active &-dot {
    background: var(--color-orange-400);
    border-color: var(--color-orange-400);
    transform: scale(1.2);

    &::after {
      opacity: 1;
      transform: none;
    }
  }
}

/* ───────────── Progress ───────────── */
.process-progress {
  position: absolute;
  left: var(--space-outer);
  right: var(--space-outer);
  bottom: var(--space-outer);
  height: 2px;
  border-radius: 2px;
  overflow: hidden;
  background: var(--process-line);

  &-bar {
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #f6c177, var(--color-orange-400) 60%, var(--color-cyan-400));
    transform: scaleX(var(--process-progress));
    transform-origin: left;
  }
}

@media (prefers-reduced-motion: reduce) {
  .process-char,
  .process-step-description,
  .process-step-tags li,
  .process-number-strip {
    transition-duration: 0.01s !important;
  }
}
</style>
