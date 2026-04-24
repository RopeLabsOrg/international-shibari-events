<script setup lang="ts">
import { computed, ref } from "vue";
import EventCard from "../components/EventCard.vue";
import { getEventSummaries, loadEventsData, sortEventSummaries, type TSortKey } from "../lib/events";
import { useWatchlist } from "../lib/watchlist";

const { watchedSlugs, count } = useWatchlist();
const events = loadEventsData();
const sortKey = ref<TSortKey>("eventDate");

const sortOptions: Array<{ value: TSortKey; label: string }> = [
  { value: "eventDate", label: "Next event date" },
  { value: "ticketDate", label: "Ticket date" },
  { value: "status", label: "Status priority" },
  { value: "lastUpdated", label: "Recently updated" },
  { value: "name", label: "Name (A-Z)" },
];

const watchedSummaries = computed(() => {
  const watched = events.filter((event) => watchedSlugs.value.has(event.slug));
  return sortEventSummaries(getEventSummaries(watched), sortKey.value);
});

const missingCount = computed(() => watchedSlugs.value.size - watchedSummaries.value.length);
</script>

<template>
  <section>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-[var(--color-secondary)] sm:text-4xl">
          Your watchlist
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          Events you're keeping an eye on. Stored in this browser — no account, no sync across devices.
        </p>
      </div>
      <label v-if="count > 0" class="flex items-center gap-2 text-sm text-[var(--color-text)]">
        <span>Sort by</span>
        <select
          v-model="sortKey"
          class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] shadow-sm focus:border-[var(--color-secondary)] focus:outline-none"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </header>

    <div v-if="watchedSummaries.length > 0" class="grid gap-4">
      <EventCard v-for="summary in watchedSummaries" :key="summary.event.slug" :summary="summary" />
    </div>

    <div
      v-else
      class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-lg shadow-[rgba(58,42,26,0.08)]"
    >
      <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
        Not watching any events yet
      </h2>
      <p class="mt-2 text-sm text-[var(--color-muted)]">
        Browse the directory and tap <strong class="text-[var(--color-primary)]">Watch</strong> on any event to save it here.
      </p>
      <RouterLink
        to="/"
        class="mt-4 inline-flex rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-surface-strong)] transition hover:bg-[var(--color-primary-hover)]"
      >
        Browse events
      </RouterLink>
    </div>

    <p
      v-if="missingCount > 0"
      class="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]"
    >
      {{ missingCount }} watched {{ missingCount === 1 ? "event is" : "events are" }} no longer in the directory.
    </p>
  </section>
</template>
