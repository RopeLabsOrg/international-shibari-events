<script setup lang="ts">
import { computed, ref } from "vue";

interface IProps {
  email: string;
  className?: string;
  revealLabel?: string;
  linkLabel?: string;
  requireReveal?: boolean;
  showAddressWhenRevealed?: boolean;
}

const props = withDefaults(defineProps<IProps>(), {
  className: "",
  revealLabel: "Reveal email",
  linkLabel: "Email",
  requireReveal: false,
  showAddressWhenRevealed: true,
});

const isRevealed = ref(!props.requireReveal);
const obfuscatedDisplay = computed(() => props.email.split("").reverse().join(""));

function revealEmail(): void {
  isRevealed.value = true;
}

function openEmailClient(): void {
  window.location.href = `mailto:${props.email}`;
}
</script>

<template>
  <button
    v-if="!isRevealed"
    type="button"
    :class="props.className"
    @click="revealEmail"
  >
    {{ props.revealLabel }}
  </button>
  <button
    v-else
    type="button"
    :class="props.className"
    @click="openEmailClient"
  >
    <span
      v-if="props.showAddressWhenRevealed"
      class="[direction:rtl] [unicode-bidi:bidi-override]"
    >
      {{ obfuscatedDisplay }}
    </span>
    <span v-else>
      {{ props.linkLabel }}
    </span>
  </button>
</template>
