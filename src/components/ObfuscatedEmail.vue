<script setup lang="ts">
import { computed, ref } from "vue";

interface IProps {
  email: string;
  className?: string;
  revealLabel?: string;
  requireReveal?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  className: "",
  revealLabel: "Reveal email",
  requireReveal: false,
});

const isRevealed = ref(!props.requireReveal);
const obfuscatedDisplay = computed(() => props.email.split("").reverse().join(""));
const mailtoHref = computed(() => `mailto:${props.email}`);

function revealEmail(): void {
  isRevealed.value = true;
}

</script>

<template>
  <button
    v-if="!isRevealed"
    type="button"
    :class="[
      'cursor-pointer border-0 bg-transparent p-0 text-[var(--color-secondary)] underline decoration-dotted underline-offset-2 transition hover:text-[var(--color-primary)]',
      props.className,
    ]"
    @click="revealEmail"
  >
    {{ props.revealLabel }}
  </button>
  <a
    v-else
    :href="mailtoHref"
    :class="[
      'text-[var(--color-secondary)] underline decoration-dotted underline-offset-2 transition hover:text-[var(--color-primary)]',
      props.className,
    ]"
  >
    <span class="[direction:rtl] [unicode-bidi:bidi-override]">
      {{ obfuscatedDisplay }}
    </span>
  </a>
</template>
