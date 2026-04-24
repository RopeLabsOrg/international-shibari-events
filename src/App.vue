<script setup lang="ts">
import { useWatchlist } from "./lib/watchlist";

const { count: watchCount } = useWatchlist();
</script>

<template>
  <div class="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
    <header class="border-b border-[var(--color-border)] bg-white/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <RouterLink class="text-lg font-semibold tracking-wide text-[var(--color-secondary)]" to="/">
          International Shibari Events
        </RouterLink>
        <nav class="flex items-center gap-2">
          <RouterLink
            to="/watchlist"
            class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-primary)] bg-[var(--color-surface-strong)] px-3 py-1 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-[var(--color-surface-strong)]"
            active-class="bg-[var(--color-primary)] text-[var(--color-surface-strong)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>Watchlist<span v-if="watchCount > 0"> ({{ watchCount }})</span></span>
          </RouterLink>
          <a
            class="hidden rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-sm text-[var(--color-secondary)] transition hover:-translate-y-0.5 hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)] sm:inline-flex"
            href="https://shibari-events.tsurineko.org"
          >
            shibari-events.tsurineko.org
          </a>
        </nav>
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
