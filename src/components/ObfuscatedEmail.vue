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
const mailtoHref = computed(() => `mailto:${props.email}`);

function revealEmail(): void {
  isRevealed.value = true;
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
  <a
    v-else
    :href="mailtoHref"
    :class="props.className"
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
  </a>
</template>
