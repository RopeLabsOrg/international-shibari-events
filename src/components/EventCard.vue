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
    class="cursor-pointer rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg shadow-[rgba(58,42,26,0.1)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-xl hover:shadow-[rgba(58,42,26,0.15)]"
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
        <p class="mt-1 text-sm text-[var(--color-muted)]">
          {{ event.location.city }}, {{ event.location.country }}
        </p>
      </div>
      <StatusPill :status="event.status" />
    </div>

    <div class="mt-4 grid gap-2 sm:grid-cols-2">
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
        <p class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
          Event date
        </p>
        <p class="mt-1 text-sm font-medium text-[var(--color-text)]">
          {{ dateRange }}
          <span v-if="summary.nextDate.isEstimated" class="ml-2 rounded-full bg-[rgba(127,103,71,0.14)] px-2 py-0.5 text-xs text-[var(--color-highlight)]">
            Estimated
          </span>
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-3">
        <p class="text-xs uppercase tracking-wide text-[var(--color-muted)]">
          Ticket date
        </p>
        <p class="mt-1 text-sm font-medium text-[var(--color-text)]">
          {{ summary.ticketDate.value ? summary.ticketDate.value.toISOString().slice(0, 10) : "TBA" }}
          <span v-if="summary.ticketDate.isEstimated" class="ml-2 rounded-full bg-[rgba(127,103,71,0.14)] px-2 py-0.5 text-xs text-[var(--color-highlight)]">
            Estimated
          </span>
        </p>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2 text-sm">
      <a
        v-if="event.links.website"
        :href="event.links.website"
        class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
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
        class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
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
        class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
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
          :require-reveal="true"
          class-name="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-[var(--color-secondary)] transition hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
        />
      </div>
    </div>
  </article>
</template>
