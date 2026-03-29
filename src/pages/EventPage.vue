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
    <RouterLink class="mb-6 inline-flex text-sm text-[var(--color-secondary)] hover:text-[var(--color-primary)]" to="/">
      ← Back to all events
    </RouterLink>

    <header class="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-3xl font-bold text-slate-50">
          {{ event.name }}
        </h1>
        <StatusPill :status="event.status" />
      </div>
      <p class="mt-2 text-slate-300">
        {{ event.location.venue }} · {{ event.location.city }}, {{ event.location.country }}
      </p>
      <p class="mt-2 text-sm text-slate-400">
        Last updated: {{ event.lastUpdated }}
      </p>
      <div class="mt-4 inline-flex rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-200">
        Temporal state: {{ temporalStateLabelMap[temporalState] }}
      </div>
    </header>

    <section class="mt-6 grid gap-4 lg:grid-cols-2">
      <article
        v-for="edition in editionData.editions"
        :key="edition.title"
        class="rounded-xl border border-slate-800 bg-slate-900/70 p-5"
      >
        <h2 class="text-lg font-semibold text-slate-100">
          {{ edition.title }}
        </h2>
        <p class="mt-1 text-sm text-slate-400">
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
          <p class="text-sm text-slate-300">
            Range:
            {{ formatDateRange(edition.startDate.value, edition.endDate.value) }}
          </p>
        </div>
      </article>
    </section>

    <section class="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 class="text-xl font-semibold text-slate-100">
        Prediction provenance
      </h2>
      <p class="mt-2 text-sm text-slate-300">
        Forecasts are derived from observed cadence between historical edition start dates and median event duration.
      </p>
      <ul class="mt-3 grid gap-2 text-sm text-slate-200 md:grid-cols-3">
        <li class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          Cadence: every {{ editionData.prediction.cadenceDays }} days
        </li>
        <li class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          Typical duration: {{ editionData.prediction.durationDays }} days
        </li>
        <li class="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          Historical samples: {{ editionData.prediction.sampleSize }}
        </li>
      </ul>
      <div v-if="editionData.prediction.sourceNotes.length > 0" class="mt-4">
        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Source notes
        </h3>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          <li v-for="note in editionData.prediction.sourceNotes" :key="note">
            {{ note }}
          </li>
        </ul>
      </div>
    </section>

    <section class="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 class="text-xl font-semibold text-slate-100">
        Historical editions
      </h2>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full min-w-[640px] text-left text-sm text-slate-300">
          <thead class="text-xs uppercase tracking-wide text-slate-400">
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
              class="border-t border-slate-800"
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

    <section class="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
      <h2 class="text-xl font-semibold text-slate-100">
        Official links
      </h2>
      <div class="mt-4 flex flex-wrap gap-2 text-sm">
        <a
          v-if="event.links.website"
          :href="event.links.website"
          class="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          Website
        </a>
        <a
          v-if="event.links.fetlife"
          :href="event.links.fetlife"
          class="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
          target="_blank"
          rel="noopener noreferrer"
        >
          FetLife
        </a>
        <a
          v-if="event.links.mailingList"
          :href="event.links.mailingList"
          class="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
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
          class-name="text-slate-200"
        />
      </div>
    </section>
  </section>

  <section v-else class="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
    <h1 class="text-2xl font-semibold text-slate-100">
      Event not found
    </h1>
    <p class="mt-2 text-sm text-slate-300">
      The selected event slug does not exist in current data files.
    </p>
    <RouterLink class="mt-4 inline-flex text-sm text-[var(--color-secondary)] hover:text-[var(--color-primary)]" to="/">
      Back to all events
    </RouterLink>
  </section>
</template>
