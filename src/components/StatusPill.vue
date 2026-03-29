<script setup lang="ts">
import { computed } from "vue";
import type { TStatus } from "../../schemas/event.schema";

const props = defineProps<{
  status: TStatus;
}>();

const statusLabelMap: Record<TStatus, string> = {
  scheduled: "Scheduled",
  on_sale: "On sale",
  sold_out: "Sold out",
  waiting_list: "Waiting list",
  tba: "TBA",
};

const statusClassMap: Record<TStatus, string> = {
  scheduled: "border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text)]",
  on_sale: "border border-[#65805a] bg-[#dce9d6] text-[#33412d]",
  sold_out: "border border-[#8f6468] bg-[#f0dfdf] text-[#5a2f33]",
  waiting_list: "border border-[#9d8658] bg-[#f3ead7] text-[#5f4a1f]",
  tba: "border border-[var(--color-border)] bg-[#ebe2ce] text-[var(--color-muted)]",
};

const label = computed(() => statusLabelMap[props.status]);
const className = computed(() => statusClassMap[props.status]);
</script>

<template>
  <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" :class="className">
    {{ label }}
  </span>
</template>
