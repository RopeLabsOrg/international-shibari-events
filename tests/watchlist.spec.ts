import { beforeEach, describe, expect, it } from "vitest";
import { _resetWatchlistForTests, useWatchlist } from "../src/lib/watchlist";

const STORAGE_KEY = "shibari-events.watchlist.v1";

describe("useWatchlist", () => {
  beforeEach(() => {
    _resetWatchlistForTests();
  });

  it("starts empty", () => {
    const { watchedSlugs, count, isWatching } = useWatchlist();
    expect(watchedSlugs.value.size).toBe(0);
    expect(count.value).toBe(0);
    expect(isWatching("any-slug")).toBe(false);
  });

  it("watch adds a slug and persists to localStorage", () => {
    const { watch, isWatching, count } = useWatchlist();
    watch("prague-shibari-festival-spring-edition");
    expect(isWatching("prague-shibari-festival-spring-edition")).toBe(true);
    expect(count.value).toBe(1);
    const stored = localStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(stored as string)).toEqual(["prague-shibari-festival-spring-edition"]);
  });

  it("unwatch removes a slug and persists", () => {
    const { watch, unwatch, isWatching, count } = useWatchlist();
    watch("onawa-asobi-europe");
    watch("pinse-camp");
    unwatch("onawa-asobi-europe");
    expect(isWatching("onawa-asobi-europe")).toBe(false);
    expect(isWatching("pinse-camp")).toBe(true);
    expect(count.value).toBe(1);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) as string)).toEqual(["pinse-camp"]);
  });

  it("toggle flips membership", () => {
    const { toggle, isWatching } = useWatchlist();
    toggle("danish-shibari-festival");
    expect(isWatching("danish-shibari-festival")).toBe(true);
    toggle("danish-shibari-festival");
    expect(isWatching("danish-shibari-festival")).toBe(false);
  });

  it("watching the same slug twice is a no-op", () => {
    const { watch, count } = useWatchlist();
    watch("pinse-camp");
    watch("pinse-camp");
    expect(count.value).toBe(1);
  });

  it("unwatching an unknown slug is a no-op", () => {
    const { unwatch, count } = useWatchlist();
    unwatch("never-saved");
    expect(count.value).toBe(0);
  });

  it("two instances share the same reactive state", () => {
    const a = useWatchlist();
    const b = useWatchlist();
    a.watch("ropelinked-summer-edition");
    expect(b.isWatching("ropelinked-summer-edition")).toBe(true);
    expect(b.count.value).toBe(1);
  });

  it("picks up changes from other tabs via storage events", () => {
    const { count, isWatching } = useWatchlist();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["graines-de-cordes"]));
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: JSON.stringify(["graines-de-cordes"]),
      }),
    );
    expect(isWatching("graines-de-cordes")).toBe(true);
    expect(count.value).toBe(1);
  });

  it("ignores malformed localStorage entries", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{");
    _resetWatchlistForTests();
    localStorage.setItem(STORAGE_KEY, "not-json{");
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: "not-json{" }),
    );
    const { count } = useWatchlist();
    expect(count.value).toBe(0);
  });
});
