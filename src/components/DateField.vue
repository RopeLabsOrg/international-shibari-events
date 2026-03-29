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
  <div class="rounded-lg border border-slate-800 bg-slate-900/80 p-3">
    <p class="text-xs uppercase tracking-wide text-slate-400">
      {{ label }}
    </p>
    <p class="mt-1 text-sm font-medium text-slate-100">
      {{ formattedDate }}
      <span v-if="isEstimated" class="ml-2 rounded bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300">
        Estimated
      </span>
    </p>
  </div>
</template>
