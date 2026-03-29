<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import StatusPill from "./StatusPill.vue";
import ObfuscatedEmail from "./ObfuscatedEmail.vue";
import { formatDateRange } from "../lib/events";
import type { IEventSummary } from "../lib/events";

const props = defineProps<{
  summary: IEventSummary;
}>();

const router = useRouter();
const event = computed(() => props.summary.event);
const dateRange = computed(() =>
  formatDateRange(
    props.summary.nextDate.value,
    props.summary.endDate.value,
  ),
);

async function openEventDetails(): Promise<void> {
  await router.push(`/events/${event.value.slug}`);
}
</script>

<template>
  <article
    class="cursor-pointer rounded-xl border border-slate-800 bg-slate-900/70 p-5 shadow-lg shadow-black/20 transition hover:border-[var(--color-primary)]"
    role="link"
    tabindex="0"
    @click="openEventDetails()"
    @keydown.enter.prevent="openEventDetails()"
    @keydown.space.prevent="openEventDetails()"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <RouterLink
          class="text-lg font-semibold text-[var(--color-secondary)] transition hover:text-[var(--color-primary)]"
          :to="`/events/${event.slug}`"
          @click.stop
          @keydown.enter.stop
          @keydown.space.stop
        >
          {{ event.name }}
        </RouterLink>
        <p class="mt-1 text-sm text-slate-300">
          {{ event.location.city }}, {{ event.location.country }}
        </p>
      </div>
      <StatusPill :status="event.status" />
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <div class="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <p class="text-xs uppercase tracking-wide text-slate-400">
          Event date
        </p>
        <p class="mt-1 text-sm font-medium text-slate-100">
          {{ dateRange }}
          <span v-if="summary.nextDate.isEstimated" class="ml-2 rounded bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300">
            Estimated
          </span>
        </p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <p class="text-xs uppercase tracking-wide text-slate-400">
          Ticket date
        </p>
        <p class="mt-1 text-sm font-medium text-slate-100">
          {{ summary.ticketDate.value ? summary.ticketDate.value.toISOString().slice(0, 10) : "TBA" }}
          <span v-if="summary.ticketDate.isEstimated" class="ml-2 rounded bg-amber-600/20 px-2 py-0.5 text-xs text-amber-300">
            Estimated
          </span>
        </p>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-sm">
      <a
        v-if="event.links.website"
        :href="event.links.website"
        class="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
        target="_blank"
        rel="noopener noreferrer"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      >
        Website
      </a>
      <a
        v-if="event.links.fetlife"
        :href="event.links.fetlife"
        class="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
        target="_blank"
        rel="noopener noreferrer"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      >
        FetLife
      </a>
      <a
        v-if="event.links.mailingList"
        :href="event.links.mailingList"
        class="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
        target="_blank"
        rel="noopener noreferrer"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      >
        Mailing list
      </a>
      <div
        v-if="event.links.contactEmail"
        @click.stop
        @keydown.enter.stop
        @keydown.space.stop
      >
        <ObfuscatedEmail
          :email="event.links.contactEmail"
          reveal-label="Reveal email"
          link-label="Email"
          :require-reveal="true"
          :show-address-when-revealed="false"
          class-name="rounded border border-slate-700 px-3 py-1 text-slate-200 transition hover:border-[var(--color-primary)] hover:text-[var(--color-secondary)]"
        />
      </div>
    </div>
  </article>
</template>
