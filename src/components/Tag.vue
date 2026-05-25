<script setup lang="ts">
import { computed } from "vue";
import { tagLabels, type TagVariant } from "./tagVariants";

const props = defineProps<{
  variant: TagVariant;
}>();

const classes = computed(() => ["tag", `tag-variant-${props.variant}`]);
</script>

<template>
  <div :class="classes">
    <p class="tag-copy">{{ tagLabels[props.variant] }}</p>
  </div>
</template>

<style scoped lang="scss">
.tag {
  border-radius: var(--radius-md);
  padding: calc(var(--space-xxs) - var(--stroke-md)) calc(var(--space-sm  ) - var(--stroke-md));
  border: var(--stroke-md) solid transparent;

  &-copy {
    font-size: var(--font-size-xs);
    font-weight: 700;
  }

  &-variant {
    &-vue {
      background-color: #42b883;
      color: #0a2e1c;
    }

    &-nuxt {
      background-color: #00dc82;
      color: #0a2e1c;
    }

    &-tailwind {
      background-color: #38bdf8;
      color: #0c2942;
    }

    &-laravel {
      background-color: #ff2d20;
      color: white;
    }

    &-pinia {
      background-color: #ffd859;
      color: #362d03;
    }

    &-gsap {
      background-color: #88ce02;
      color: #1a2600;
    }

    &-three {
      background-color: #ed9c55;
      color: #492708;
    }

    &-react {
      background-color: #61dafb;
      color: #0f2e36;
    }

    &-websockets {
      background-color: #2674a4;
      color: white;
    }

    &-redis {
      background-color: #ce4036;
      color: white;
    }

    &-html {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-css {
      color: var(--color-text-400);
      border-color: var(--color-grayscale-400);
    }

    &-javascript {
      background-color: #ffdf4f;
      color: #362d03;
    }

    &-typescript {
      background-color: #3178c6;
      color: white;
    }

    &-node {
      background-color: #237d23;
      color: white;
    }

    &-next {
      background-color: white;
      color: black;
    }

    &-bootstrap {
      background-color: #7952b3;
      color: white;
    }

    &-php {
      background-color: #777bb4;
      color: white;
    }

    &-mysql {
      background-color: #4479a1;
      color: white;
    }

    &-vuelidate {
      background-color: #42b883;
      color: #0a2e1c;
    }

    &-axios {
      background-color: #5a29e4;
      color: white;
    }

    &-socketio {
      background-color: #010101;
      color: white;
    }

    &-chartjs {
      background-color: #ff6384;
      color: white;
    }

    &-primevue {
      background-color: #41b883;
      color: #0a2e1c;
    }

    &-zod {
      background-color: #3068b7;
      color: white;
    }

    &-nestjs {
      background-color: #e0234e;
      color: white;
    }

    &-mongodb {
      background-color: #47a248;
      color: white;
    }

    &-i18n {
      background-color: #26a69a;
      color: white;
    }

    &-pusher {
      background-color: #300d4f;
      color: white;
    }

    &-sass {
      background-color: #cd6799;
      color: white;
    }

    &-nuxtui {
      background-color: #00dc82;
      color: #0a2e1c;
    }

    &-kubernetes {
      background-color: #326ce5;
      color: white;
    }

    &-postgresql {
      background-color: #2f6c92;
      color: white;
    }

    &-ogl {
      background-color: #0e5495;
      color: white;
    }

    &-glsl {
      background-color: #95630e;
      color: white;
    }
  }
}
</style>
