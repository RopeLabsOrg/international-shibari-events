<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <RouterLink class="text-lg font-semibold tracking-wide text-[var(--color-primary)]" to="/">
          International Shibari Events
        </RouterLink>
        <a
          class="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 transition hover:border-[var(--color-secondary)] hover:text-[var(--color-secondary)]"
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
