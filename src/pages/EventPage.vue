<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import DateField from "../components/DateField.vue";
import ObfuscatedEmail from "../components/ObfuscatedEmail.vue";
import StatusPill from "../components/StatusPill.vue";
import { buildEditionDisplays, formatDateRange, getEventSummaries, loadEventsData } from "../lib/events";

const route = useRoute();
const events = loadEventsData();

const event = computed(() => {
  const slug = route.params.slug;
  if (typeof slug !== "string") {
    return null;
  }

  return events.find((eventData) => eventData.slug === slug) || null;
});

const editionData = computed(() => (event.value ? buildEditionDisplays(event.value) : null));
const temporalState = computed(() => {
  if (!event.value) {
    return "upcoming";
  }
  return getEventSummaries([event.value])[0].temporalState;
});

const temporalStateLabelMap: Record<string, string> = {
  happening_now: "Happening now",
  upcoming: "Upcoming",
  ended: "Ended",
};
</script>

<template>
  <section v-if="event && editionData">
    <RouterLink class="mb-6 inline-flex text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)]" to="/">
      ← Back to all events
    </RouterLink>

    <header class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg shadow-[rgba(58,42,26,0.1)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-bold text-[var(--color-secondary)]">
          {{ event.name }}
        </h1>
        <StatusPill :status="event.status" />
      </div>
      <p class="mt-2 text-[var(--color-text)]">
        {{ event.location.venue }} · {{ event.location.city }}, {{ event.location.country }}
      </p>
      <p class="mt-2 text-sm text-[var(--color-muted)]">
        Last updated: {{ event.lastUpdated }}
      </p>
      <div class="mt-4 inline-flex rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2 text-sm text-[var(--color-text)]">
        Temporal state: {{ temporalStateLabelMap[temporalState] }}
      </div>
    </header>

    <section class="mt-6 grid gap-4 lg:grid-cols-2">
      <article
        v-for="edition in editionData.editions"
        :key="edition.title"
        class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg shadow-[rgba(58,42,26,0.08)]"
      >
        <h2 class="text-lg font-semibold text-[var(--color-secondary)]">
          {{ edition.title }}
        </h2>
        <p class="mt-1 text-sm text-[var(--color-muted)]">
          {{ edition.confidenceLabel }}
        </p>

        <div class="mt-4 grid gap-3">
          <DateField
            label="Event dates"
            :value="edition.startDate.value"
            :is-estimated="edition.startDate.isEstimated"
          />
          <DateField
            label="Ticket date"
            :value="edition.ticketDate.value"
            :is-estimated="edition.ticketDate.isEstimated"
          />
          <DateField
            label="Announcement date"
            :value="edition.announcementDate.value"
            :is-estimated="edition.announcementDate.isEstimated"
          />
          <p class="text-sm text-[var(--color-text)]">
            Range:
            {{ formatDateRange(edition.startDate.value, edition.endDate.value) }}
          </p>
        </div>
      </article>
    </section>

    <section class="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg shadow-[rgba(58,42,26,0.08)]">
      <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
        Prediction provenance
      </h2>
      <p class="mt-2 text-sm text-[var(--color-text)]">
        Forecasts are derived from observed cadence between historical edition start dates and median event duration.
      </p>
      <ul class="mt-3 grid gap-2 text-sm text-[var(--color-text)] md:grid-cols-3">
        <li class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          Cadence: every {{ editionData.prediction.cadenceDays }} days
        </li>
        <li class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          Typical duration: {{ editionData.prediction.durationDays }} days
        </li>
        <li class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          Historical samples: {{ editionData.prediction.sampleSize }}
        </li>
      </ul>
      <div v-if="editionData.prediction.sourceNotes.length > 0" class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Source notes
        </h3>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-text)]">
          <li v-for="note in editionData.prediction.sourceNotes" :key="note">
            {{ note }}
          </li>
        </ul>
      </div>
    </section>

    <section class="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg shadow-[rgba(58,42,26,0.08)]">
      <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
        Historical editions
      </h2>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm text-[var(--color-text)]">
          <thead class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            <tr>
              <th class="pb-2">Dates</th>
              <th class="pb-2">Announcement</th>
              <th class="pb-2">Ticket sale</th>
              <th class="pb-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="edition in event.historicalEditions"
              :key="`${edition.startDate}-${edition.endDate}`"
              class="border-t border-[var(--color-border)]"
            >
              <td class="py-2">{{ edition.startDate }} - {{ edition.endDate }}</td>
              <td class="py-2">{{ edition.announcementDate || "Unknown" }}</td>
              <td class="py-2">{{ edition.ticketSaleDate || "Unknown" }}</td>
              <td class="py-2">{{ edition.sourceNotes }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg shadow-[rgba(58,42,26,0.08)]">
      <h2 class="text-xl font-semibold text-[var(--color-secondary)]">
        Official links
      </h2>
      <div class="mt-4 flex flex-wrap gap-2 text-sm">
        <a
          v-if="event.links.website"
          :href="event.links.website"
          class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Website
        </a>
        <a
          v-if="event.links.fetlife"
          :href="event.links.fetlife"
          class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          FetLife
        </a>
        <a
          v-if="event.links.mailingList"
          :href="event.links.mailingList"
          class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mailing list
        </a>
        <ObfuscatedEmail
          v-if="event.links.contactEmail"
          :email="event.links.contactEmail"
          reveal-label="Reveal contact email"
          :require-reveal="true"
          class-name="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
        />
      </div>
    </section>
  </section>

  <section v-else class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-lg shadow-[rgba(58,42,26,0.1)]">
    <h1 class="text-2xl font-semibold text-[var(--color-secondary)]">
      Event not found
    </h1>
    <p class="mt-2 text-sm text-[var(--color-text)]">
      The selected event slug does not exist in current data files.
    </p>
    <RouterLink class="mt-4 inline-flex text-sm font-medium text-[var(--color-secondary)] hover:text-[var(--color-primary)]" to="/">
      Back to all events
    </RouterLink>
  </section>
</template>
