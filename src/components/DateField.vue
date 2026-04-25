<script setup lang="ts">
import { computed } from "vue";
import { confidenceAriaLabel, formatDisplayDate, formatEstimatedLabel } from "../lib/events";
import type { TConfidenceLevel } from "../lib/predictions";

const props = defineProps<{
  label: string;
  value: Date | null;
  isEstimated: boolean;
  confidence?: TConfidenceLevel;
}>();

const formattedDate = computed(() => formatDisplayDate(props.value));
const badgeText = computed(() =>
  props.confidence ? formatEstimatedLabel(props.confidence) : "Estimated",
);
const badgeAriaLabel = computed(() =>
  props.confidence ? confidenceAriaLabel(props.confidence) : "Estimated date",
);
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
    <p class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
      {{ label }}
    </p>
    <p class="mt-1 text-sm font-medium text-[var(--color-text)]">
      {{ formattedDate }}
      <span
        v-if="isEstimated"
        class="ml-2 rounded-full bg-[rgba(44,74,107,0.10)] px-2 py-0.5 text-xs font-medium text-[var(--color-secondary)]"
        :aria-label="badgeAriaLabel"
      >
        {{ badgeText }}
      </span>
    </p>
  </div>
</template>
