<script setup lang="ts">
import { computed } from "vue";
import { formatDisplayDate } from "../lib/events";

const props = defineProps<{
  label: string;
  value: Date | null;
  isEstimated: boolean;
}>();

const formattedDate = computed(() => formatDisplayDate(props.value));
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
    <p class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
      {{ label }}
    </p>
    <p class="mt-1 text-sm font-medium text-[var(--color-text)]">
      {{ formattedDate }}
      <span v-if="isEstimated" class="ml-2 rounded-full bg-[rgba(127,103,71,0.14)] px-2 py-0.5 text-xs text-[var(--color-highlight)]">
        Estimated
      </span>
    </p>
  </div>
</template>
