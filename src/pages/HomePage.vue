<script setup lang="ts">
import { computed, ref } from "vue";
import EventCard from "../components/EventCard.vue";
import ObfuscatedEmail from "../components/ObfuscatedEmail.vue";
import { getEventSummaries, loadEventsData, sortEventSummaries, type TSortKey } from "../lib/events";

const sortKey = ref<TSortKey>("eventDate");
const events = loadEventsData();
const CONTACT_EMAIL = "contact@tsurineko.org";

const sortOptions: Array<{ value: TSortKey; label: string }> = [
  { value: "eventDate", label: "Next event date" },
  { value: "ticketDate", label: "Ticket date" },
  { value: "status", label: "Status priority" },
  { value: "lastUpdated", label: "Recently updated" },
  { value: "name", label: "Name (A-Z)" },
];

const sortedSummaries = computed(() => sortEventSummaries(getEventSummaries(events), sortKey.value));
</script>

<template>
  <section>
    <header class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-50">
          Event Buyer Guide
        </h1>
        <p class="mt-2 max-w-2xl text-sm text-slate-300">
          Track upcoming rope events, ticket windows, and status at a glance. Estimated dates are labeled clearly.
        </p>
        <div class="mt-3 max-w-2xl rounded-md border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200">
          Missing an event?
          <a
            href="https://github.com/RopeLabsOrg/international-shibari-events"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-[var(--color-secondary)] transition hover:text-[var(--color-primary)]"
          >
            Open a pull request on GitHub
          </a>
          , or email
          <ObfuscatedEmail
            :email="CONTACT_EMAIL"
            class-name="font-medium text-[var(--color-secondary)] transition hover:text-[var(--color-primary)]"
          />
          .
        </div>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-200">
        <span>Sort by</span>
        <select
          v-model="sortKey"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-[var(--color-secondary)] focus:outline-none"
        >
          <option v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
    </header>

    <div class="grid gap-4">
      <EventCard v-for="summary in sortedSummaries" :key="summary.event.slug" :summary="summary" />
    </div>
  </section>
</template>
