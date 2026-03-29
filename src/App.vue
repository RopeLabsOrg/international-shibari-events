<template>
  <div class="min-h-screen bg-[var(--color-page)] text-[var(--color-text)]">
    <header class="border-b border-[var(--color-border)] bg-white/70 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink class="text-lg font-semibold tracking-wide text-[var(--color-secondary)]" to="/">
          International Shibari Events
        </RouterLink>
        <a
          class="rounded-xl border border-[var(--color-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-sm text-[var(--color-secondary)] transition hover:-translate-y-0.5 hover:bg-[var(--color-secondary)] hover:text-[var(--color-surface-strong)]"
          href="https://international-events.tsurineko.org"
        >
          international-events.tsurineko.org
        </a>
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
