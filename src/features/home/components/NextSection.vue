<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { nextSection, type PaperStage } from "../../../animations/transitions/next-section";
import { t } from "../../../i18n/utils/translate";
import { locale } from "../../../i18n/store";
import { paperPlane } from "../../../three/paper-plane";
import { projectVisible } from "../../../composables/useRouteObserver";
import Contact from "./Contact.vue";

const sectionRef = ref<HTMLElement | null>(null);
const paperRef = ref<HTMLCanvasElement | null>(null);
const stage = ref<PaperStage>("write");
const delivered = ref(false);

const words = computed(() => [
  { stage: "write", label: t("paper-word-write") },
  { stage: "fold", label: t("paper-word-fold") },
  { stage: "send", label: t("paper-word-send") },
]);

const letter = computed(() => ({
  to: t("letter-to"),
  title: t("letter-title").split("|"),
  body: t("letter-body"),
  signature: t("letter-signature"),
  stamp: t("letter-stamp"),
}));

const deliveredDate = computed(() =>
  new Intl.DateTimeFormat(locale.value ?? "en", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
);

// giant background words shrink for longer translations so they never overflow
const wordSize = (label: string) => `min(24vw, ${Math.round(150 / Math.max(label.length, 1))}vw)`;

watch(projectVisible, (visible) => paperPlane.setPaused(visible), { immediate: true });

onMounted(() => {
  if (paperRef.value) {
    paperPlane.init(paperRef.value);
  }

  watch(letter, (copy) => copy.body && paperPlane.setLetter(copy), { immediate: true });

  if (sectionRef.value) {
    nextSection.setup(sectionRef.value, {
      onStage: (value) => {
        stage.value = value;
      },
      onDelivered: (value) => {
        delivered.value = value;
      },
    });
  }
});

onUnmounted(() => {
  nextSection.destroy();
  paperPlane.destroy();
});
</script>

<template>
  <section class="next-section" ref="sectionRef" id="next">
    <div class="next-section__container" :class="{ 'is-delivered': delivered }">
      <!-- WRITE. FOLD. SEND. -->
      <div class="next-section__words" aria-hidden="true">
        <span
          v-for="word in words"
          :key="word.stage"
          :class="{ 'is-active': stage === word.stage }"
          :style="{ fontSize: wordSize(word.label) }"
          >{{ word.label }}</span
        >
      </div>

      <!-- the letter is drawn in WebGL; keep its words available to assistive tech -->
      <div class="next-section__sr">
        <h2>{{ letter.title.join(" ") }}</h2>
        <p>{{ letter.body }}</p>
      </div>

      <!-- Contact layer: revealed once the unfolded letter covers the screen -->
      <div class="next-section__reveal">
        <div class="next-section__reveal-content">
          <Contact no-transition />

          <div class="next-section__stamp" aria-hidden="true">
            <span class="next-section__stamp-title">{{ t("paper-delivered") }}</span>
            <span class="next-section__stamp-date">{{ deliveredDate }}</span>
            <span class="next-section__stamp-foot">MV · {{ t("letter-stamp") }}</span>
          </div>
        </div>
      </div>

      <canvas class="next-section__paper" ref="paperRef" aria-hidden="true"></canvas>

      <p class="next-section__hint" :class="{ 'is-visible': stage === 'write' }">{{ t("paper-hint") }}</p>
    </div>
  </section>
</template>

<style lang="scss">
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

.next-section {
  position: relative;
  width: 100%;
  height: 450vh; // PERF: shorter scroll on mobile = fewer animation frames
  background: radial-gradient(120% 90% at 50% 40%, #39352e 0%, var(--color-black-400) 55%, #24221d 100%);
  z-index: 1;

  @include mixins.mq("md") {
    height: 600vh;
  }

  &__container {
    position: sticky;
    top: 0;
    width: 100%;
    height: calc(var(--lvh) * 100);
    overflow: hidden;
    contain: layout style paint; // PERF: enable browser containment optimizations

    // the stamp lands with a small thud
    &.is-delivered {
      animation: next-section-thud 0.45s ease-out 0.32s both;
    }
  }

  &__words {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
    user-select: none;

    span {
      grid-area: 1 / 1;
      font-weight: 900;
      letter-spacing: -0.03em;
      line-height: 1;
      white-space: nowrap;
      color: transparent;
      -webkit-text-stroke: 1.5px rgba(245, 239, 230, 0.1);
      opacity: 0;
      transform: translateY(6%) scale(0.96);
      transition:
        opacity 0.8s ease,
        transform 1.2s $ease-out-expo;

      &.is-active {
        opacity: 1;
        transform: none;
      }
    }
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  &__paper {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    z-index: 3;
    pointer-events: none;
  }

  &__hint {
    position: absolute;
    left: 50%;
    bottom: calc(var(--space-outer) + 12px);
    z-index: 4;
    transform: translateX(-50%);
    font-size: var(--font-size-sm);
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(245, 239, 230, 0.5);
    opacity: 0;
    transition: opacity 0.4s ease;

    &.is-visible {
      opacity: 1;
    }
  }

  // ─── Contact layer ───
  &__reveal {
    position: absolute;
    inset: 0;
    background: rgb(233, 222, 208); // must match the paper and Three.js colors.beigeDark
    clip-path: inset(0 0 100% 0); // opened by the timeline once the letter covers the screen
    z-index: 2;
  }

  &__reveal-content {
    width: 100%;
    height: 100%;
    opacity: 1;
    position: relative;
    z-index: 5; // above the canvas
  }

  // ─── "Delivered" rubber stamp ───
  &__stamp {
    position: absolute;
    // phones: beside the short second row of socials, clear of the title and the avatar
    right: var(--space-outer);
    top: calc(var(--space-outer) + 168px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 12px 6px;
    border: 3px solid var(--color-orange-400);
    border-radius: 10px;
    box-shadow:
      inset 0 0 0 3px rgb(233, 222, 208),
      inset 0 0 0 5px var(--color-orange-400);
    color: var(--color-orange-400);
    text-transform: uppercase;
    pointer-events: none;
    user-select: none;
    opacity: 0;
    transform: rotate(-12deg) scale(2.4);
    // worn rubber look
    mask-image: radial-gradient(circle at 30% 40%, #000 60%, rgba(0, 0, 0, 0.75) 61%, #000 75%);

    @include mixins.mq("md") {
      top: calc(var(--height-header) + var(--space-xxl));
      right: 8vw;
      padding: 14px 26px 12px;
    }

    &-title {
      font-weight: 900;
      font-size: 18px;
      letter-spacing: 0.12em;
      line-height: 1;

      @include mixins.mq("md") {
        font-size: 40px;
      }
    }

    &-date {
      font-family: "ProFontWindows", monospace;
      font-size: 11px;
      letter-spacing: 0.08em;

      @include mixins.mq("md") {
        font-size: 18px;
      }
    }

    &-foot {
      font-weight: 700;
      font-size: 8px;
      letter-spacing: 0.2em;
      opacity: 0.8;

      @include mixins.mq("md") {
        font-size: 12px;
      }
    }
  }

  &__container.is-delivered &__stamp {
    animation: next-section-stamp 0.5s cubic-bezier(0.3, 0, 0.2, 1) 0.15s both;
  }
}

@keyframes next-section-stamp {
  0% {
    opacity: 0;
    transform: rotate(-4deg) scale(2.4);
    filter: blur(6px);
  }
  55% {
    opacity: 1;
    transform: rotate(-13deg) scale(0.94);
    filter: blur(0);
  }
  75% {
    transform: rotate(-11.5deg) scale(1.03);
  }
  100% {
    opacity: 0.92;
    transform: rotate(-12deg) scale(1);
  }
}

@keyframes next-section-thud {
  0%,
  100% {
    transform: none;
  }
  20% {
    transform: translate(-3px, 4px);
  }
  40% {
    transform: translate(3px, -2px);
  }
  60% {
    transform: translate(-2px, 1px);
  }
  80% {
    transform: translate(1px, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .next-section__container.is-delivered {
    animation: none;
  }
}

// Global class applied to the Three.js canvas when it's moved into the reveal
.three-canvas-in-reveal {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 1 !important;
  pointer-events: none !important;
}
</style>
