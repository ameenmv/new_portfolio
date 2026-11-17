<script setup lang="ts">
import { computed } from "vue";
import ButtonWrapper from "./ButtonWrapper.vue";

const props = defineProps<{
  size?: "sm" | "md" | "lg";
}>();

const classes = computed(() => ["button-round", `button-round-size-${props.size ?? "md"}`, "children-unclickable"]);
</script>

<template>
  <ButtonWrapper v-bind="props" rounded :class="classes">
    <slot></slot>
  </ButtonWrapper>
</template>

<style scoped lang="scss">
.button-round {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  flex-shrink: 0;
  border-radius: 50%;

  &-size {
    &-sm {
      width: 32px;
      height: 32px; // explicit: iOS Safari stretches aspect-ratio boxes holding an svg
      padding: 6px;
    }

    &-md {
      width: 44px;
      height: 44px; // explicit: iOS Safari stretches aspect-ratio boxes holding an svg
      padding: 10px;
    }

    &-lg {
      width: 52px;
      height: 52px; // explicit: iOS Safari stretches aspect-ratio boxes holding an svg
      padding: 14px;
    }
  }
}
</style>
