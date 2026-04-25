import { describe, expect, it } from "vitest";
import type { IEventData, TStatus } from "../schemas/event.schema";
import {
  countActiveFilters,
  EMPTY_FILTERS,
  extractCountryOptions,
  extractMonthOptions,
  extractStatusOptions,
  filterEventSummaries,
  getEventSummaries,
} from "../src/lib/events";

function makeEvent(overrides: Partial<IEventData> & Pick<IEventData, "slug">): IEventData {
  return {
    name: overrides.name ?? `Event ${overrides.slug}`,
    slug: overrides.slug,
    location: overrides.location ?? { city: "City", country: "Country", venue: "Venue" },
    links: overrides.links ?? { website: null, fetlife: null, mailingList: null, contactEmail: null },
    status: overrides.status ?? "scheduled",
    lastUpdated: overrides.lastUpdated ?? "2026-04-01",
    historicalEditions: overrides.historicalEditions ?? [],
    nextEdition: overrides.nextEdition ?? {
      startDate: null,
      endDate: null,
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "tba",
    },
  };
}

const now = new Date("2026-04-01T00:00:00Z");

const fixtures = [
  makeEvent({
    slug: "austrian-rope-retreat",
    location: { city: "Zobern", country: "Austria", venue: "Venue A" },
    status: "scheduled",
    nextEdition: {
      startDate: "2026-09-17",
      endDate: "2026-09-21",
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "scheduled",
    },
  }),
  makeEvent({
    slug: "kasumi-hourai-akane-antwerp",
    location: { city: "Antwerp", country: "Belgium", venue: "Venue B" },
    status: "on_sale",
    nextEdition: {
      startDate: "2026-05-01",
      endDate: "2026-05-04",
      announcementDate: null,
      ticketSaleDate: "2026-01-20",
      ticketUrl: null,
      status: "on_sale",
    },
  }),
  makeEvent({
    slug: "pinse-camp",
    location: { city: "Sonder Felding", country: "Denmark", venue: "Venue C" },
    status: "sold_out",
    nextEdition: {
      startDate: "2026-05-22",
      endDate: "2026-05-25",
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "sold_out",
    },
  }),
  makeEvent({
    slug: "onawa-asobi-europe",
    location: { city: "Antwerp", country: "Belgium", venue: "Venue D" },
    status: "scheduled",
    nextEdition: {
      startDate: "2026-09-26",
      endDate: "2026-09-27",
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "scheduled",
    },
  }),
];

const summaries = getEventSummaries(fixtures, now);

describe("filterEventSummaries", () => {
  it("returns all summaries with empty filters", () => {
    expect(filterEventSummaries(summaries, EMPTY_FILTERS)).toHaveLength(4);
  });

  it("filters by country", () => {
    const result = filterEventSummaries(summaries, { ...EMPTY_FILTERS, country: "Belgium" });
    expect(result.map((summary) => summary.event.slug)).toEqual([
      "kasumi-hourai-akane-antwerp",
      "onawa-asobi-europe",
    ]);
  });

  it("filters by status", () => {
    const result = filterEventSummaries(summaries, { ...EMPTY_FILTERS, status: "sold_out" });
    expect(result.map((summary) => summary.event.slug)).toEqual(["pinse-camp"]);
  });

  it("filters by month (YYYY-MM against nextDate)", () => {
    const result = filterEventSummaries(summaries, { ...EMPTY_FILTERS, month: "2026-09" });
    expect(result.map((summary) => summary.event.slug).sort()).toEqual([
      "austrian-rope-retreat",
      "onawa-asobi-europe",
    ]);
  });

  it("ANDs multiple filters", () => {
    const result = filterEventSummaries(summaries, {
      country: "Belgium",
      month: "2026-09",
      status: null,
    });
    expect(result.map((summary) => summary.event.slug)).toEqual(["onawa-asobi-europe"]);
  });

  it("excludes summaries without a resolved nextDate when month filter is set", () => {
    const withoutDate = getEventSummaries(
      [...fixtures, makeEvent({ slug: "no-dates", status: "tba" })],
      now,
    );
    const result = filterEventSummaries(withoutDate, { ...EMPTY_FILTERS, month: "2026-09" });
    expect(result.some((summary) => summary.event.slug === "no-dates")).toBe(false);
  });
});

describe("option extractors", () => {
  it("extractCountryOptions returns unique sorted countries", () => {
    expect(extractCountryOptions(summaries)).toEqual(["Austria", "Belgium", "Denmark"]);
  });

  it("extractMonthOptions returns sorted year-month values with labels", () => {
    const options = extractMonthOptions(summaries);
    expect(options.map((option) => option.value)).toEqual(["2026-05", "2026-09"]);
    expect(options[0].label).toMatch(/May 2026/);
  });

  it("extractStatusOptions returns statuses in priority order, only those present", () => {
    expect(extractStatusOptions(summaries)).toEqual(["on_sale", "scheduled", "sold_out"]);
  });
});

describe("countActiveFilters", () => {
  it("counts non-null filter fields", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(countActiveFilters({ country: "Belgium", month: null, status: null })).toBe(1);
    expect(countActiveFilters({ country: "Belgium", month: "2026-09", status: "on_sale" as TStatus })).toBe(3);
  });
});
