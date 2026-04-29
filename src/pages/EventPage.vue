<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import DateField from "../components/DateField.vue";
import ObfuscatedEmail from "../components/ObfuscatedEmail.vue";
import StatusPill from "../components/StatusPill.vue";
import WatchButton from "../components/WatchButton.vue";
import {
  buildEditionDisplays,
  buildTimelineRows,
  formatDateRange,
  getEventSummaries,
  linkifySourceNotes,
  loadEventsData,
} from "../lib/events";
import { classifyConfidence, getCadenceAndDuration } from "../lib/predictions";

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
const eventConfidence = computed(() =>
  event.value ? classifyConfidence(getCadenceAndDuration(event.value).sampleSize) : "low",
);
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

const timelineRows = computed(() => (event.value ? buildTimelineRows(event.value) : []));
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
        <div class="flex items-center gap-3">
          <WatchButton :slug="event.slug" size="md" />
          <StatusPill :status="event.status" />
        </div>
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
            :confidence="eventConfidence"
          />
          <DateField
            label="Ticket date"
            :value="edition.ticketDate.value"
            :is-estimated="edition.ticketDate.isEstimated"
            :confidence="eventConfidence"
          />
          <DateField
            label="Announcement date"
            :value="edition.announcementDate.value"
            :is-estimated="edition.announcementDate.isEstimated"
            :confidence="eventConfidence"
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
      <ul
        class="mt-3 grid gap-2 text-sm text-[var(--color-text)]"
        :class="event.cancelledEditions?.length ? 'md:grid-cols-4' : 'md:grid-cols-3'"
      >
        <li class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          Cadence: every {{ editionData.prediction.cadenceDays }} days
        </li>
        <li class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          Typical duration: {{ editionData.prediction.durationDays }} days
        </li>
        <li class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
          Historical samples: {{ editionData.prediction.sampleSize }}
        </li>
        <li
          v-if="event.cancelledEditions?.length"
          class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3"
        >
          Cancellations recorded: {{ event.cancelledEditions.length }}
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
              v-for="row in timelineRows"
              :key="row.key"
              class="border-t border-[var(--color-border)]"
              :class="row.kind === 'cancelled' ? 'text-[var(--color-muted)]' : ''"
            >
              <template v-if="row.kind === 'held'">
                <td class="py-2">{{ row.startDate }} - {{ row.endDate }}</td>
                <td class="py-2">{{ row.announcementDate || "Unknown" }}</td>
                <td class="py-2">{{ row.ticketSaleDate || "Unknown" }}</td>
                <td class="py-2">
                  <template v-for="(segment, segmentIndex) in linkifySourceNotes(row.sourceNotes)" :key="segmentIndex">
                    <a
                      v-if="segment.type === 'link'"
                      :href="segment.value"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-block py-1 underline text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                    >{{ segment.value }}</a>
                    <template v-else>{{ segment.value }}</template>
                  </template>
                </td>
              </template>
              <template v-else>
                <td class="py-2">
                  <span class="sr-only">Cancelled edition: </span>
                  <del>{{ row.year }}</del>
                  <span aria-hidden="true"> Cancelled</span>
                </td>
                <td class="py-2">—</td>
                <td class="py-2">—</td>
                <td class="py-2">
                  <template v-for="(segment, segmentIndex) in linkifySourceNotes(row.sourceNotes)" :key="segmentIndex">
                    <a
                      v-if="segment.type === 'link'"
                      :href="segment.value"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-block py-1 underline text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                    >{{ segment.value }}</a>
                    <template v-else>{{ segment.value }}</template>
                  </template>
                </td>
              </template>
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
