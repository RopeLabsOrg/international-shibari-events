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
  // Safari private mode + strict-privacy settings can throw SecurityError on getItem.
  // Must swallow here — this runs at module import, so any throw white-screens the SPA.
  try {
    if (typeof localStorage === "undefined") return new Set();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

function writeToStorage(slugs: ReadonlySet<string>): void {
  // QuotaExceededError + Safari private-mode SecurityError both throw here.
  // Failing silently is preferable to crashing a click handler; the in-memory ref
  // stays authoritative for the session, and the next reload will re-read (may be empty).
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs].sort()));
  } catch {
    // Best-effort. User still sees reactive updates; persistence just doesn't stick.
  }
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
  // Read-modify-write against localStorage, not the in-memory ref. Prevents a cross-tab
  // race where Tab B's handler runs before its storage-event listener has absorbed Tab A's
  // concurrent write — otherwise B would clobber A's change.
  const next = new Set(readFromStorage());
  if (next.has(slug)) {
    watchedSlugs.value = next;
    return;
  }
  next.add(slug);
  watchedSlugs.value = next;
  writeToStorage(next);
}

function unwatch(slug: string): void {
  const next = new Set(readFromStorage());
  if (!next.has(slug)) {
    watchedSlugs.value = next;
    return;
  }
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
