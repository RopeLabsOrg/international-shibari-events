<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import EventCard from "../components/EventCard.vue";
import ObfuscatedEmail from "../components/ObfuscatedEmail.vue";
import {
  countActiveFilters,
  extractCountryOptions,
  extractMonthOptions,
  extractStatusOptions,
  filterEventSummaries,
  getEventSummaries,
  loadEventsData,
  sortEventSummaries,
  type TSortKey,
} from "../lib/events";
import type { TStatus } from "../../schemas/event.schema";

const CONTACT_EMAIL = "contact@tsurineko.org";

const events = loadEventsData();
const allSummaries = getEventSummaries(events);

const route = useRoute();
const router = useRouter();

const sortOptions: Array<{ value: TSortKey; label: string }> = [
  { value: "eventDate", label: "Next event date" },
  { value: "ticketDate", label: "Ticket date" },
  { value: "status", label: "Status priority" },
  { value: "lastUpdated", label: "Recently updated" },
  { value: "name", label: "Name (A-Z)" },
];

const statusLabels: Record<TStatus, string> = {
  on_sale: "On sale",
  waiting_list: "Waiting list",
  scheduled: "Scheduled",
  sold_out: "Sold out",
  tba: "TBA",
};

const countryOptions = extractCountryOptions(allSummaries);
const monthOptions = extractMonthOptions(allSummaries);
const statusOptions = extractStatusOptions(allSummaries);

function readQuery(key: string): string | null {
  const raw = route.query[key];
  if (typeof raw !== "string" || raw.length === 0) return null;
  return raw;
}

const sortKey = computed<TSortKey>({
  get: () => {
    const raw = readQuery("sort");
    if (raw && sortOptions.some((option) => option.value === raw)) return raw as TSortKey;
    return "eventDate";
  },
  set: (value) => updateQuery("sort", value === "eventDate" ? null : value),
});

const countryFilter = computed<string | null>({
  get: () => {
    const raw = readQuery("country");
    return raw && countryOptions.includes(raw) ? raw : null;
  },
  set: (value) => updateQuery("country", value),
});

const monthFilter = computed<string | null>({
  get: () => {
    const raw = readQuery("month");
    return raw && monthOptions.some((option) => option.value === raw) ? raw : null;
  },
  set: (value) => updateQuery("month", value),
});

const statusFilter = computed<TStatus | null>({
  get: () => {
    const raw = readQuery("status");
    return raw && (statusOptions as string[]).includes(raw) ? (raw as TStatus) : null;
  },
  set: (value) => updateQuery("status", value),
});

function updateQuery(key: string, value: string | null): void {
  const next = { ...route.query };
  if (value === null || value === "") {
    delete next[key];
  } else {
    next[key] = value;
  }
  router.replace({ query: next });
}

function clearFilters(): void {
  const next = { ...route.query };
  delete next.country;
  delete next.month;
  delete next.status;
  router.replace({ query: next });
}

const activeFilters = computed(() => ({
  country: countryFilter.value,
  month: monthFilter.value,
  status: statusFilter.value,
}));

const activeCount = computed(() => countActiveFilters(activeFilters.value));

const visibleSummaries = computed(() => {
  const filtered = filterEventSummaries(allSummaries, activeFilters.value);
  return sortEventSummaries(filtered, sortKey.value);
});
</script>

<template>
  <section>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-[var(--color-secondary)] sm:text-4xl">
          Upcoming Events
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
          Track upcoming rope events, ticket windows, and status at a glance. Dates may be estimates.
        </p>
        <div class="mt-3 max-w-2xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] shadow-lg shadow-[rgba(58,42,26,0.1)]">
          Missing an event?
          <a
            href="https://github.com/RopeLabsOrg/international-shibari-events"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-[var(--color-secondary)] transition hover:text-[var(--color-primary)]"
          >
            Open a pull request on GitHub
          </a>
          , or email
          <ObfuscatedEmail :email="CONTACT_EMAIL" />
          .
        </div>
      </div>
      <label class="flex items-center gap-2 text-sm text-[var(--color-text)]">
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

    <section
      aria-label="Filter events"
      class="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm"
    >
      <label class="flex flex-col text-xs uppercase tracking-wide text-[var(--color-muted)]">
        Country
        <select
          v-model="countryFilter"
          class="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)] shadow-sm focus:border-[var(--color-secondary)] focus:outline-none"
        >
          <option :value="null">All countries</option>
          <option v-for="country in countryOptions" :key="country" :value="country">
            {{ country }}
          </option>
        </select>
      </label>
      <label class="flex flex-col text-xs uppercase tracking-wide text-[var(--color-muted)]">
        Month
        <select
          v-model="monthFilter"
          class="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)] shadow-sm focus:border-[var(--color-secondary)] focus:outline-none"
        >
          <option :value="null">Any month</option>
          <option v-for="option in monthOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="flex flex-col text-xs uppercase tracking-wide text-[var(--color-muted)]">
        Status
        <select
          v-model="statusFilter"
          class="mt-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)] shadow-sm focus:border-[var(--color-secondary)] focus:outline-none"
        >
          <option :value="null">Any status</option>
          <option v-for="status in statusOptions" :key="status" :value="status">
            {{ statusLabels[status] }}
          </option>
        </select>
      </label>
      <button
        v-if="activeCount > 0"
        type="button"
        class="ml-auto self-end rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm font-medium text-[var(--color-secondary)] transition hover:border-[var(--color-secondary)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
        @click="clearFilters"
      >
        Clear filters ({{ activeCount }})
      </button>
    </section>

    <div v-if="visibleSummaries.length > 0" class="grid gap-4">
      <EventCard v-for="summary in visibleSummaries" :key="summary.event.slug" :summary="summary" />
    </div>

    <div
      v-else
      class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-lg shadow-[rgba(58,42,26,0.08)]"
    >
      <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
        No events match these filters
      </h2>
      <p class="mt-2 text-sm text-[var(--color-muted)]">
        Try widening the range — clear a filter or two and the directory will expand.
      </p>
      <button
        v-if="activeCount > 0"
        type="button"
        class="mt-4 inline-flex rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-surface-strong)] transition hover:bg-[var(--color-primary-hover)]"
        @click="clearFilters"
      >
        Clear filters
      </button>
    </div>
  </section>
</template>
