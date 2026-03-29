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
  scheduled: "bg-slate-700 text-slate-100",
  on_sale: "bg-emerald-600 text-emerald-50",
  sold_out: "bg-rose-700 text-rose-50",
  waiting_list: "bg-amber-500 text-amber-950",
  tba: "bg-slate-600 text-slate-200",
};

const label = computed(() => statusLabelMap[props.status]);
const className = computed(() => statusClassMap[props.status]);
</script>

<template>
  <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" :class="className">
    {{ label }}
  </span>
</template>
