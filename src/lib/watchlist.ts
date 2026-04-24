import { ref, computed, type ComputedRef, type Ref } from "vue";

const STORAGE_KEY = "shibari-events.watchlist.v1";

export interface IWatchlist {
  watchedSlugs: Ref<ReadonlySet<string>>;
  count: ComputedRef<number>;
  isWatching: (slug: string) => boolean;
  watch: (slug: string) => void;
  unwatch: (slug: string) => void;
  toggle: (slug: string) => void;
}

function readFromStorage(): Set<string> {
  if (typeof localStorage === "undefined") return new Set();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

function writeToStorage(slugs: ReadonlySet<string>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs].sort()));
}

const watchedSlugs = ref<ReadonlySet<string>>(readFromStorage());

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      watchedSlugs.value = readFromStorage();
    }
  });
}

const count = computed(() => watchedSlugs.value.size);

function isWatching(slug: string): boolean {
  return watchedSlugs.value.has(slug);
}

function watch(slug: string): void {
  if (watchedSlugs.value.has(slug)) return;
  const next = new Set(watchedSlugs.value);
  next.add(slug);
  watchedSlugs.value = next;
  writeToStorage(next);
}

function unwatch(slug: string): void {
  if (!watchedSlugs.value.has(slug)) return;
  const next = new Set(watchedSlugs.value);
  next.delete(slug);
  watchedSlugs.value = next;
  writeToStorage(next);
}

function toggle(slug: string): void {
  if (watchedSlugs.value.has(slug)) {
    unwatch(slug);
  } else {
    watch(slug);
  }
}

export function useWatchlist(): IWatchlist {
  return { watchedSlugs, count, isWatching, watch, unwatch, toggle };
}

export function _resetWatchlistForTests(): void {
  watchedSlugs.value = new Set();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
