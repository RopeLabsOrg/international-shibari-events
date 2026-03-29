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
  scheduled: "border border-[#5b78a6] bg-[#d8e4f5] text-[#243958]",
  on_sale: "border border-[#4f7a3f] bg-[#cfe5c4] text-[#1f3a1a]",
  sold_out: "border border-[#9a4d56] bg-[#f2cfd3] text-[#5a1f26]",
  waiting_list: "border border-[#a8742f] bg-[#f5dfb8] text-[#5c3a0f]",
  tba: "border border-[#8f7a52] bg-[#efe0bf] text-[#5b4a28]",
};

const label = computed(() => statusLabelMap[props.status]);
const className = computed(() => statusClassMap[props.status]);
</script>

<template>
  <span class="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" :class="className">
    {{ label }}
  </span>
</template>
