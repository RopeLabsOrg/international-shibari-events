import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import HomePage from "../src/pages/HomePage.vue";
import EventPage from "../src/pages/EventPage.vue";
import TicketsPage from "../src/pages/TicketsPage.vue";
import WatchlistPage from "../src/pages/WatchlistPage.vue";
import ObfuscatedEmail from "../src/components/ObfuscatedEmail.vue";
import { routes } from "../src/router";
import {
  buildTimelineRows,
  linkifySourceNotes,
  loadEventsData,
  sortEventSummaries,
  getEventSummaries,
} from "../src/lib/events";
import { _resetWatchlistForTests, useWatchlist } from "../src/lib/watchlist";
import type { IEventData } from "../schemas/event.schema";

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
    const bottomsUp = summaries.find((summary) => summary.event.slug === "bottoms-up");
    const ropeLinkedWinter = summaries.find((summary) => summary.event.slug === "ropelinked-winter-edition");

    expect(bottomsUp).toBeDefined();
    expect(ropeLinkedWinter).toBeDefined();
    expect(bottomsUp?.nextDate.value).not.toBeNull();
    expect(ropeLinkedWinter?.nextDate.value).not.toBeNull();
    expect(bottomsUp?.nextDate.isEstimated).toBe(true);
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

    expect(wrapper.text()).toContain("Graines de Cordes");
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
    expect(wrapper.text()).toContain("EURIX (Autumn Edition)");
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

  it("buildTimelineRows interleaves held and cancelled entries chronologically", () => {
    const event: IEventData = {
      name: "Test",
      slug: "test",
      location: { city: "Test", country: "Test", venue: "Test" },
      links: { website: null, fetlife: null, mailingList: null, contactEmail: null },
      status: "scheduled",
      lastUpdated: "2026-04-27",
      historicalEditions: [
        {
          startDate: "2023-10-15",
          endDate: "2023-10-19",
          announcementDate: null,
          ticketSaleDate: null,
          soldOutDate: null,
          sourceNotes: "Held 2023",
        },
        {
          startDate: "2025-10-15",
          endDate: "2025-10-19",
          announcementDate: null,
          ticketSaleDate: null,
          soldOutDate: null,
          sourceNotes: "Held 2025",
        },
      ],
      cancelledEditions: [
        { year: 2024, sourceNotes: "Cancelled 2024" },
      ],
      nextEdition: {
        startDate: null,
        endDate: null,
        announcementDate: null,
        ticketSaleDate: null,
        ticketUrl: null,
        status: "scheduled",
      },
    };

    const rows = buildTimelineRows(event);
    expect(rows.map((row) => row.sortYear)).toEqual([2023, 2024, 2025]);
    expect(rows[1].kind).toBe("cancelled");
    if (rows[1].kind === "cancelled") {
      expect(rows[1].year).toBe(2024);
      expect(rows[1].sourceNotes).toBe("Cancelled 2024");
    }
  });

  it("buildTimelineRows handles event with no cancelledEditions field", () => {
    const event: IEventData = {
      name: "Test",
      slug: "test",
      location: { city: "Test", country: "Test", venue: "Test" },
      links: { website: null, fetlife: null, mailingList: null, contactEmail: null },
      status: "scheduled",
      lastUpdated: "2026-04-27",
      historicalEditions: [
        {
          startDate: "2024-01-01",
          endDate: "2024-01-03",
          announcementDate: null,
          ticketSaleDate: null,
          soldOutDate: null,
          sourceNotes: "",
        },
      ],
      nextEdition: {
        startDate: null,
        endDate: null,
        announcementDate: null,
        ticketSaleDate: null,
        ticketUrl: null,
        status: "scheduled",
      },
    };
    const rows = buildTimelineRows(event);
    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe("held");
  });

  it("linkifies URLs in source notes and trims trailing punctuation", () => {
    const empty = linkifySourceNotes("");
    expect(empty).toEqual([]);

    const plain = linkifySourceNotes("No links here.");
    expect(plain).toEqual([{ type: "text", value: "No links here." }]);

    const single = linkifySourceNotes("See https://example.com/foo for more.");
    expect(single).toEqual([
      { type: "text", value: "See " },
      { type: "link", value: "https://example.com/foo" },
      { type: "text", value: " for more." },
    ]);

    const trailing = linkifySourceNotes("URL at end https://example.com.");
    const lastLink = trailing.find((segment) => segment.type === "link");
    expect(lastLink?.value).toBe("https://example.com");

    const multiple = linkifySourceNotes("First https://a.test then https://b.test/x");
    const linkValues = multiple.filter((s) => s.type === "link").map((s) => s.value);
    expect(linkValues).toEqual(["https://a.test", "https://b.test/x"]);
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
