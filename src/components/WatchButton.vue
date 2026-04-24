<script setup lang="ts">
import { computed } from "vue";
import { useWatchlist } from "../lib/watchlist";

const props = defineProps<{
  slug: string;
  size?: "sm" | "md";
}>();

const size = computed(() => props.size ?? "sm");
const { isWatching, toggle } = useWatchlist();
const watching = computed(() => isWatching(props.slug));

const label = computed(() => (watching.value ? "Watching" : "Watch"));
const ariaLabel = computed(() =>
  watching.value ? `Stop watching this event` : `Watch this event`,
);

function handleClick(): void {
  toggle(props.slug);
}
</script>

<template>
  <button
    type="button"
    :aria-pressed="watching"
    :aria-label="ariaLabel"
    :title="watching ? 'Remove from watchlist' : 'Save to your watchlist (stored in this browser)'"
    :class="[
      'inline-flex items-center gap-1.5 rounded-xl border font-medium transition',
      size === 'sm' ? 'px-3 py-1 text-sm' : 'px-4 py-2 text-base',
      watching
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-surface-strong)] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)]'
        : 'border-[var(--color-primary)] bg-[var(--color-surface-strong)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-surface-strong)]',
    ]"
    @click.stop="handleClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      :fill="watching ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
    {{ label }}
  </button>
</template>
