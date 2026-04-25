<script setup lang="ts">
import { computed } from "vue";
import EventCard from "../components/EventCard.vue";
import {
  getEventSummaries,
  loadEventsData,
  sortEventSummaries,
  type IEventSummary,
} from "../lib/events";

const events = loadEventsData();
const now = new Date();
const allSummaries = getEventSummaries(events, now);

function isOnSale(summary: IEventSummary): boolean {
  return summary.event.status === "on_sale" || summary.event.status === "waiting_list";
}

function hasUpcomingTicketWindow(summary: IEventSummary): boolean {
  if (!summary.ticketDate.value) return false;
  return summary.ticketDate.value.getTime() >= now.getTime();
}

function hasEnded(summary: IEventSummary): boolean {
  return summary.temporalState === "ended";
}

const onSaleNow = computed(() =>
  sortEventSummaries(
    allSummaries.filter((summary) => !hasEnded(summary) && isOnSale(summary)),
    "ticketDate",
  ),
);

const openingLater = computed(() =>
  sortEventSummaries(
    allSummaries.filter(
      (summary) =>
        !hasEnded(summary) && !isOnSale(summary) && hasUpcomingTicketWindow(summary),
    ),
    "ticketDate",
  ),
);

const totalCount = computed(() => onSaleNow.value.length + openingLater.value.length);
</script>

<template>
  <section>
    <header class="mb-6">
      <h1 class="text-3xl font-bold text-[var(--color-secondary)] sm:text-4xl">
        Ticket watch
      </h1>
      <p class="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        Events you can act on — tickets already open, or opening soon. Sorted by ticket window.
      </p>
    </header>

    <section v-if="onSaleNow.length > 0" class="mb-8">
      <div class="mb-3 flex items-center gap-3">
        <h2 class="text-xl font-semibold text-[var(--color-primary)]">
          Tickets on sale now
        </h2>
        <span class="rounded-full bg-[rgba(194,86,42,0.12)] px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
          {{ onSaleNow.length }}
        </span>
      </div>
      <div class="grid gap-4">
        <EventCard
          v-for="summary in onSaleNow"
          :key="summary.event.slug"
          :summary="summary"
        />
      </div>
    </section>

    <section v-if="openingLater.length > 0">
      <div class="mb-3 flex items-center gap-3">
        <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
          Tickets opening later
        </h2>
        <span class="rounded-full bg-[rgba(44,74,107,0.10)] px-2 py-0.5 text-xs font-medium text-[var(--color-secondary)]">
          {{ openingLater.length }}
        </span>
      </div>
      <div class="grid gap-4">
        <EventCard
          v-for="summary in openingLater"
          :key="summary.event.slug"
          :summary="summary"
        />
      </div>
    </section>

    <div
      v-if="totalCount === 0"
      class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-lg shadow-[rgba(58,42,26,0.08)]"
    >
      <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
        No ticket windows to watch right now
      </h2>
      <p class="mt-2 text-sm text-[var(--color-muted)]">
        Nothing is currently on sale, and no upcoming ticket dates are recorded.
        Check the full directory for events still being planned.
      </p>
      <RouterLink
        to="/"
        class="mt-4 inline-flex rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-surface-strong)] transition hover:bg-[var(--color-primary-hover)]"
      >
        Browse events
      </RouterLink>
    </div>
  </section>
</template>
