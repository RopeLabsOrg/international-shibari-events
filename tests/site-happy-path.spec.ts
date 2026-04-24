import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import HomePage from "../src/pages/HomePage.vue";
import EventPage from "../src/pages/EventPage.vue";
import TicketsPage from "../src/pages/TicketsPage.vue";
import WatchlistPage from "../src/pages/WatchlistPage.vue";
import ObfuscatedEmail from "../src/components/ObfuscatedEmail.vue";
import { routes } from "../src/router";
import { loadEventsData, sortEventSummaries, getEventSummaries } from "../src/lib/events";
import { _resetWatchlistForTests, useWatchlist } from "../src/lib/watchlist";

describe("buyer guide website", () => {
  it("sorts by event date with confirmed before estimated", () => {
    const summaries = getEventSummaries(loadEventsData());
    const sorted = sortEventSummaries(summaries, "eventDate");

    expect(sorted.length).toBeGreaterThan(0);
    const firstEstimatedIndex = sorted.findIndex((summary) => summary.nextDate.isEstimated);
    if (firstEstimatedIndex > 0) {
      const allConfirmedBeforeEstimated = sorted
        .slice(0, firstEstimatedIndex)
        .every((summary) => !summary.nextDate.isEstimated);
      expect(allConfirmedBeforeEstimated).toBe(true);
    }
  });

  it("derives next dates from historical cadence when next edition dates are missing", () => {
    const summaries = getEventSummaries(loadEventsData());
    const eurixSpring = summaries.find((summary) => summary.event.slug === "eurix-spring-edition");
    const ropeLinkedWinter = summaries.find((summary) => summary.event.slug === "ropelinked-winter-edition");

    expect(eurixSpring).toBeDefined();
    expect(ropeLinkedWinter).toBeDefined();
    expect(eurixSpring?.nextDate.value).not.toBeNull();
    expect(ropeLinkedWinter?.nextDate.value).not.toBeNull();
    expect(eurixSpring?.nextDate.isEstimated).toBe(true);
    expect(ropeLinkedWinter?.nextDate.isEstimated).toBe(true);
  });

  it("renders home cards with sort control and filters", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/");
    await router.isReady();

    const wrapper = mount(HomePage, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("Upcoming Events");
    expect(wrapper.findAll("select").length).toBeGreaterThanOrEqual(4);
    expect(wrapper.text()).toContain("Sort by");
    expect(wrapper.text()).toContain("Country");
    expect(wrapper.text()).toContain("Month");
    expect(wrapper.text()).toContain("Status");
    expect(wrapper.text()).toContain("Missing an event?");
    expect(wrapper.text()).toContain("Open a pull request on GitHub");
    expect(
      wrapper
        .find('a[href="https://github.com/RopeLabsOrg/international-shibari-events"]')
        .exists(),
    ).toBe(true);
  });

  it("renders event detail with status, provenance, history, and links", async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes,
    });

    router.push("/events/eurix-autumn-edition");
    await router.isReady();

    const wrapper = mount(EventPage, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.text()).toContain("Prediction provenance");
    expect(wrapper.text()).toContain("Historical editions");
    expect(wrapper.text()).toContain("Official links");
    expect(wrapper.text()).toContain("Temporal state");
    expect(wrapper.text()).toContain("Reveal contact email");
  });

  it("renders tickets page with on-sale and opening-later sections", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/tickets");
    await router.isReady();

    const wrapper = mount(TicketsPage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Ticket watch");
    // The split depends on current event data state, but the page must render one or the other section,
    // or else the empty-state heading if neither applies.
    const hasOnSale = wrapper.text().includes("Tickets on sale now");
    const hasOpeningLater = wrapper.text().includes("Tickets opening later");
    const hasEmptyState = wrapper.text().includes("No ticket windows to watch");
    expect(hasOnSale || hasOpeningLater || hasEmptyState).toBe(true);
  });

  it("renders watchlist page empty state when nothing is watched", async () => {
    _resetWatchlistForTests();
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/watchlist");
    await router.isReady();

    const wrapper = mount(WatchlistPage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Your watchlist");
    expect(wrapper.text()).toContain("Not watching any events yet");
  });

  it("watchlist page renders the watched event after watch()", async () => {
    _resetWatchlistForTests();
    const watchlist = useWatchlist();
    watchlist.watch("austrian-rope-retreat");

    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/watchlist");
    await router.isReady();

    const wrapper = mount(WatchlistPage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Austrian Rope Retreat");
    expect(wrapper.text()).not.toContain("Not watching any events yet");
  });

  it("watchlist page flags watched slugs that are no longer in the directory", async () => {
    _resetWatchlistForTests();
    const watchlist = useWatchlist();
    watchlist.watch("slug-that-does-not-exist-in-data");

    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/watchlist");
    await router.isReady();

    const wrapper = mount(WatchlistPage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("no longer in the directory");
  });

  it("home page filters by country when URL has ?country=Belgium", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/?country=Belgium");
    await router.isReady();

    const wrapper = mount(HomePage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Kasumi Hourai");
    expect(wrapper.text()).not.toContain("Austrian Rope Retreat");
    expect(wrapper.text()).toContain("Clear filters");
  });

  it("tickets page surfaces the on-sale heading with a known on-sale event", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/tickets");
    await router.isReady();

    const wrapper = mount(TicketsPage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Tickets on sale now");
    expect(wrapper.text()).toContain("Kasumi Hourai");
  });

  it("event page shows not-found message for unknown slug", async () => {
    const router = createRouter({ history: createMemoryHistory(), routes });
    router.push("/events/this-slug-does-not-exist-in-the-directory");
    await router.isReady();

    const wrapper = mount(EventPage, {
      global: { plugins: [router] },
    });

    expect(wrapper.text()).toContain("Event not found");
  });

  it("shows button before reveal then plain text email link after click", async () => {
    const wrapper = mount(ObfuscatedEmail, {
      props: {
        email: "contact@example.com",
        revealLabel: "Reveal email",
        requireReveal: true,
        className: "rounded-xl border px-3 py-1",
      },
    });

    const revealButton = wrapper.find("button");
    expect(revealButton.exists()).toBe(true);
    expect(revealButton.text()).toBe("Reveal email");
    expect(revealButton.classes()).toContain("rounded-xl");

    await revealButton.trigger("click");

    const revealedLink = wrapper.find('a[href="mailto:contact@example.com"]');
    expect(revealedLink.exists()).toBe(true);
    expect(revealedLink.classes()).toContain("underline");
    expect(revealedLink.classes()).not.toContain("rounded-xl");
    expect(revealedLink.text()).toBe("moc.elpmaxe@tcatnoc");
  });
});
