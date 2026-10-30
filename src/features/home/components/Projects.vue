<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import { previews } from "../../../content/projects/previews";
import { locale } from "../../../i18n/store";
import NotchSection from "../../../components/NotchSection.vue";
import Banner from "../../../components/Banner.vue";
import Link from "../../../components/Link.vue";
import { t } from "../../../i18n/utils/translate";
import { isFeatureEnabled } from "../../../utils/features";
import { social } from "../../../content/social";
import { createProjectsWall } from "../../../animations/transitions/projects-wall";

import type { ProjectPreview } from "../../../content/types";

const PIN_COLORS = ["#ff8400", "#34bfff", "#f5efe6"];

const loadedPreviews = ref<ProjectPreview[] | null>(null);
const sectionRef = ref<HTMLElement | null>(null);
const boardRef = ref<HTMLElement | null>(null);
const stringsRef = ref<SVGSVGElement | null>(null);
const hintVisible = ref(false);

let wall: ReturnType<typeof createProjectsWall> | null = null;

const emit = defineEmits<{
  (e: "loaded", previews: ProjectPreview[]): void;
}>();

const loadPreviews = async () => {
  if (!locale.value) return;
  const func = previews[locale.value as keyof typeof previews];
  if (!func) return;
  const module = await func();
  loadedPreviews.value = module.default;
  emit("loaded", module.default);
};

// (re)build the wall whenever the polaroids are (re)rendered
const setupWall = async () => {
  await nextTick();
  wall?.destroy();
  wall = null;
  if (!sectionRef.value || !boardRef.value || !stringsRef.value) return;

  const cards = Array.from(boardRef.value.querySelectorAll<HTMLElement>("[data-wall-card]"));
  if (!cards.length) return;

  wall = createProjectsWall({
    section: sectionRef.value,
    board: boardRef.value,
    strings: stringsRef.value,
    cards,
    onHint: (visible) => {
      hintVisible.value = visible;
    },
  });
};

watch(locale, loadPreviews);
watch(loadedPreviews, setupWall);

onMounted(loadPreviews);

onUnmounted(() => {
  wall?.destroy();
  wall = null;
});
</script>

<template>
  <div class="projects" ref="sectionRef">
    <NotchSection class="projects-notch-start" />
    <NotchSection class="projects-notch-end" />

    <div class="projects-sticky">
      <div class="projects-board" ref="boardRef">
        <!-- title note, taped to the board -->
        <div class="projects-note">
          <span class="projects-note-tape"></span>
          <Banner class="projects-note-banner" :copy="t('selected')" size="sm" animated />
          <h2 class="projects-note-title">{{ t("projects") }}</h2>
          <p class="projects-note-copy">{{ t("projects-note") }}</p>
        </div>

        <svg class="projects-strings" ref="stringsRef" aria-hidden="true"></svg>

        <div
          v-for="(preview, i) in loadedPreviews"
          :key="preview.slug"
          class="polaroid"
          data-wall-card
        >
          <Link
            class="polaroid-link children-unclickable"
            :to="`/project/${preview.slug}`"
            :aria-label="t('switch-to-project', { project: preview.title })"
            data-cursor="arrow"
            data-sound="click"
            data-hoversound="hover"
            draggable="false"
          >
            <!-- behind the photo (z-index -1), slides out on hover -->
            <span class="polaroid-tab">{{ t("view-project") }} <span class="polaroid-tab-arrow">→</span></span>
            <span class="polaroid-photo" data-wall-photo>
              <span class="polaroid-pin" :style="{ '--pin': PIN_COLORS[i % PIN_COLORS.length] }" data-wall-pin></span>
              <span class="polaroid-image">
                <img :src="preview.thumbnail" :alt="preview.title" draggable="false" />
                <span class="polaroid-develop" data-wall-develop></span>
                <span class="polaroid-glare" data-wall-glare></span>
              </span>
              <span class="polaroid-caption">
                <span class="polaroid-label">{{ preview.title }}</span>
                <span class="polaroid-description">{{ preview.description }}</span>
              </span>
              <span class="polaroid-flash" data-wall-flash></span>
            </span>
          </Link>
        </div>

        <div v-if="loadedPreviews && isFeatureEnabled('startProject')" class="polaroid polaroid-new" data-wall-card>
          <Link
            class="polaroid-link children-unclickable"
            data-cursor="arrow-external"
            data-hoversound="hover"
            external
            :href="social[0].url"
            draggable="false"
          >
            <span class="polaroid-tab">{{ t("get-in-touch") }} <span class="polaroid-tab-arrow">↗</span></span>
            <span class="polaroid-photo" data-wall-photo>
              <span class="polaroid-pin" style="--pin: #f5efe6" data-wall-pin></span>
              <span class="polaroid-image">
                <span class="polaroid-plus">+</span>
                <span class="polaroid-glare" data-wall-glare></span>
              </span>
              <span class="polaroid-caption">
                <span class="polaroid-label">{{ t("start-a-new-project") }}</span>
                <span class="polaroid-description">{{ t("projects-new-copy") }}</span>
              </span>
              <span class="polaroid-flash" data-wall-flash></span>
            </span>
          </Link>
        </div>

        <p class="projects-hint" :class="{ 'is-visible': hintVisible }" aria-hidden="true">{{ t("projects-drag-hint") }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);

.projects {
  position: relative;
  width: 100%;
  height: calc(var(--lvh) * 520);
  background-color: var(--color-beige-400);

  @include mixins.mq("md") {
    height: calc(var(--lvh) * 420);
  }

  &-notch {
    &-start {
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-100%);
      color: var(--color-beige-400);
      --icon-color: var(--color-beige-400);
    }

    &-end {
      position: absolute;
      bottom: 0;
      left: 0;
      color: var(--color-beige-600);
      --icon-color: var(--color-beige-600);
    }
  }

  &-sticky {
    position: sticky;
    top: 0;
    height: calc(var(--lvh) * 100);
    display: grid;
    place-items: center;
    padding: calc(var(--height-header) - 8px) var(--space-outer) var(--space-outer);
    overflow: hidden;
  }

  // ─── cork board ───
  &-board {
    --frame: 14px;
    position: relative;
    width: 100%;
    max-width: 1500px;
    height: 100%;
    border-radius: 14px;
    background-color: #b9875a;
    background-image:
      radial-gradient(rgba(70, 40, 15, 0.35) 1px, transparent 1.6px),
      radial-gradient(rgba(255, 230, 190, 0.25) 1px, transparent 1.4px),
      url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .2  0 0 0 0 .08  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
    background-size:
      7px 7px,
      11px 11px,
      240px 240px;
    background-position:
      0 0,
      3px 5px,
      0 0;
    box-shadow:
      inset 0 0 0 var(--frame) #8a5a34,
      inset 0 0 0 calc(var(--frame) + 2px) #6e4527,
      inset 0 18px 40px rgba(0, 0, 0, 0.35),
      0 30px 60px -20px rgba(45, 42, 36, 0.45);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      pointer-events: none;
      box-shadow:
        inset 0 2px 0 rgba(255, 255, 255, 0.18),
        inset 0 -2px 0 rgba(0, 0, 0, 0.25);
    }
  }

  // ─── title note ───
  &-note {
    position: absolute;
    left: 50%;
    top: 2.5%;
    z-index: 30;
    padding: 14px 20px 16px;
    background: var(--color-beige-400);
    transform: translateX(-50%) rotate(-2deg);
    box-shadow: 0 8px 18px -6px rgba(0, 0, 0, 0.45);

    @include mixins.mq("md") {
      left: 3.5%;
      top: 6%;
      padding: 22px 28px 22px;
      transform: rotate(-3deg);
    }

    &-tape {
      position: absolute;
      top: -12px;
      left: 50%;
      width: 90px;
      height: 26px;
      transform: translateX(-50%) rotate(4deg);
      background: rgba(255, 132, 0, 0.55);
    }

    &-banner {
      position: absolute;
      top: 6px;
      left: -10px;
      transform: rotate(-6deg);
    }

    &-title {
      font-weight: 900;
      letter-spacing: 0.02em;
      line-height: 1;
      margin-top: var(--space-sm);
      font-size: var(--font-size-title-sm);

      @include mixins.mq("md") {
        font-size: var(--font-size-title-lg);
      }
    }

    &-copy {
      display: none;
      margin-top: var(--space-xs);
      font-family: "ProFontWindows", monospace;
      font-size: var(--font-size-sm);
      color: var(--color-text-300);

      @include mixins.mq("md") {
        display: block;
      }
    }
  }

  // ─── red string ───
  &-strings {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 25;
    overflow: visible;
    pointer-events: none;

    :deep(path) {
      fill: none;
      stroke-linecap: round;
      stroke-dasharray: 1;
    }

    :deep(.is-string) {
      stroke: #d9412b;
      stroke-width: 2.2;
    }

    // cheap shadow: an offset, wider, translucent copy
    :deep(.is-shadow) {
      stroke: rgba(0, 0, 0, 0.22);
      stroke-width: 3.5;
      transform: translate(1px, 3px);
    }
  }

  &-hint {
    position: absolute;
    right: 3.5%;
    bottom: 5%;
    z-index: 30;
    display: none;
    padding: 6px 12px;
    border-radius: 100px;
    background: rgba(45, 42, 36, 0.75);
    color: var(--color-beige-400);
    font-family: "ProFontWindows", monospace;
    font-size: var(--font-size-sm);
    opacity: 0;
    transition: opacity 0.5s ease;

    // dragging is a mouse thing
    @include mixins.hover {
      display: block;
    }

    &.is-visible {
      opacity: 1;
    }
  }
}

// ─── polaroids ───
.polaroid {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 10;
  width: clamp(140px, 42vw, 200px);
  visibility: hidden; // shown by the wall once its toss starts
  will-change: transform;
  touch-action: pan-y;
  user-select: none;

  @include mixins.mq("md") {
    width: clamp(180px, 20vw, 310px);
  }

  @include mixins.hover {
    cursor: grab;
  }

  &.is-dragging {
    cursor: grabbing;
  }

  &-link {
    position: relative; // no transform / z-index: the tab stacks behind the photo
    display: block;
    color: inherit;
    text-decoration: none;
    -webkit-user-drag: none;
  }

  &-photo {
    position: relative;
    display: block;
    padding: 10px 10px 0;
    background: #fbf8f2;
    color: inherit;
    text-decoration: none;
    box-shadow: var(--wall-shadow, 0 6px 14px -4px rgba(0, 0, 0, 0.5));
    // hover lift / lean is driven per frame by the wall (no transition chasing the cursor)
    will-change: transform; // PERF: hover never repaints the card
    -webkit-user-drag: none;
  }

  &-image {
    position: relative;
    display: block;
    aspect-ratio: 16 / 10.5;
    overflow: hidden;
    background: var(--color-black-400);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.08);
      transition: transform 0.6s $ease-out-expo;
      will-change: transform;
      pointer-events: none;
    }

    // static polaroid gloss
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        115deg,
        rgba(255, 255, 255, 0.22) 0%,
        rgba(255, 255, 255, 0) 35%,
        rgba(255, 255, 255, 0) 70%,
        rgba(255, 255, 255, 0.08) 100%
      );
    }
  }

  &-caption {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 4px 16px;
  }

  // label-maker tape
  &-label {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 2px;
    background: var(--color-black-400);
    color: var(--color-beige-400);
    font-weight: 900;
    font-size: 13px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-shadow:
      0 1px 0 rgba(0, 0, 0, 0.6),
      0 -1px 0 rgba(255, 255, 255, 0.15);
    transform: rotate(-1.5deg);

    @include mixins.mq("md") {
      font-size: clamp(13px, 1.25vw, 18px);
    }
  }

  &-description {
    font-family: "ProFontWindows", monospace;
    font-size: 11px;
    line-height: 1.3;
    color: var(--color-text-300);

    @include mixins.mq("md") {
      font-size: clamp(11px, 0.95vw, 14px);
    }
  }

  // still-developing chemistry: fades out once the photo is pinned
  &-develop {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(120% 90% at 50% 40%, rgba(120, 92, 60, 0.6), transparent 70%),
      linear-gradient(160deg, #4a3b2c, #1f1a14);
    pointer-events: none;
    will-change: opacity;
  }

  // light that follows the cursor across the print
  &-glare {
    position: absolute;
    left: -50%;
    top: -50%;
    width: 200%;
    height: 200%;
    // PERF: plain alpha, no blend mode
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 32%);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }

  // camera flash on impact
  &-flash {
    position: absolute;
    inset: -10px;
    background: radial-gradient(circle at 50% 40%, #fff, rgba(255, 255, 255, 0.6) 45%, transparent 75%);
    opacity: 0;
    pointer-events: none;
    will-change: opacity;
  }

  // "view project" tab tucked behind the right edge, slides out on hover
  &-tab {
    position: absolute;
    top: 26%;
    left: 100%; // anchored to the right edge, so it never pokes out on the left
    z-index: -1;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px 8px 18px;
    border-radius: 0 8px 8px 0;
    background: var(--color-orange-400);
    color: var(--color-white-400);
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 6px 12px -6px rgba(0, 0, 0, 0.5);
    transform-origin: left center;
    // phones: only the arrow peeks out
    transform: translateX(calc(-100% + 26px)) rotate(3deg);
    transition:
      transform 0.55s $ease-out-expo,
      opacity 0.25s ease;

    // mouse: fully tucked away until hover
    @include mixins.hover {
      opacity: 0;
      transform: translateX(-100%);
    }

    @include mixins.mq("md") {
      font-size: 12px;
      padding: 10px 14px 10px 20px;
    }

    &-arrow {
      display: inline-block;
      transition: transform 0.4s $ease-out-expo;
    }
  }

  @include mixins.hover {
    &:hover:not(.is-dragging) {
      // the hovered card (and its tab) comes to the front; beats the wall's inline z-index
      z-index: 39 !important;

      .polaroid-image img {
        transform: scale(1);
      }

      .polaroid-tab {
        opacity: 1;
        transform: translateX(-8px) rotate(4deg);
      }

      .polaroid-tab-arrow {
        transform: translateX(3px);
      }
    }
  }

  // push pin
  &-pin {
    position: absolute;
    left: 50%;
    top: 3px;
    z-index: 5;
    width: 22px;
    height: 22px;
    margin-left: -11px;
    pointer-events: none;
    opacity: 0;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background:
        radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.55) 0 12%, transparent 13%),
        radial-gradient(circle at 50% 55%, var(--pin) 0 60%, color-mix(in srgb, var(--pin) 55%, #000) 100%);
      box-shadow:
        0 4px 0 -1px color-mix(in srgb, var(--pin) 60%, #000),
        3px 9px 6px -2px rgba(0, 0, 0, 0.45);
    }
  }

  // the empty "your project?" slot
  &-new .polaroid-image {
    display: grid;
    place-items: center;
    background: repeating-linear-gradient(-45deg, #efe6d8 0 12px, #e9decd 12px 24px);
  }

  &-plus {
    font-weight: 900;
    font-size: clamp(40px, 5vw, 72px);
    line-height: 1;
    color: var(--color-orange-400);
  }
}
</style>
