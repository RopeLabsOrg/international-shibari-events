import { describe, expect, it } from "vitest";
import type { IEventData } from "../schemas/event.schema";
import { checkCancelledEditions } from "../scripts/validate-events-lib";

function makeEvent(overrides: Partial<IEventData> = {}): IEventData {
  return {
    name: "Test",
    slug: "test",
    location: { city: "C", country: "C", venue: "V" },
    links: { website: null, fetlife: null, mailingList: null, contactEmail: null },
    status: "scheduled",
    lastUpdated: "2026-04-27",
    historicalEditions: [],
    nextEdition: {
      startDate: null,
      endDate: null,
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "scheduled",
    },
    ...overrides,
  };
}

function held(starts: string[]): IEventData["historicalEditions"] {
  return starts.map((startDate) => ({
    startDate,
    endDate: startDate,
    announcementDate: null,
    ticketSaleDate: null,
    soldOutDate: null,
    internalSourceNotes: "",
    externalSourceNotes: "Test edition.",
  }));
}

describe("checkCancelledEditions", () => {
  it("returns no issues when cancelledEditions is absent", () => {
    expect(checkCancelledEditions(makeEvent())).toEqual([]);
  });

  it("returns no issues when cancelledEditions is empty", () => {
    expect(checkCancelledEditions(makeEvent({ cancelledEditions: [] }))).toEqual([]);
  });

  it("flags a cancelled year that matches a held edition's year (SC16)", () => {
    const event = makeEvent({
      historicalEditions: held(["2024-01-01", "2025-01-01"]),
      cancelledEditions: [
        {
          year: 2024,
          internalSourceNotes: "wrong entry",
          externalSourceNotes: "wrong entry",
        },
      ],
    });
    const issues = checkCancelledEditions(event);
    expect(issues).toHaveLength(1);
    expect(issues[0].year).toBe(2024);
    expect(issues[0].message).toMatch(/matches the year of a held edition/);
  });

  it("flags a cancelled year outside the held-edition range (SC17)", () => {
    const event = makeEvent({
      historicalEditions: held(["2018-01-01", "2024-01-01"]),
      cancelledEditions: [
        {
          year: 2010,
          internalSourceNotes: "Should be out of range",
          externalSourceNotes: "Should be out of range",
        },
      ],
    });
    const issues = checkCancelledEditions(event);
    expect(issues).toHaveLength(1);
    expect(issues[0].year).toBe(2010);
    expect(issues[0].message).toMatch(/outside the range/);
  });

  it("flags a cancelled year inconsistent with annual cadence (SC18 biennial)", () => {
    const event = makeEvent({
      historicalEditions: held(["2010-01-01", "2012-01-01", "2016-01-01"]),
      cancelledEditions: [
        {
          year: 2014,
          internalSourceNotes: "Biennial event, not annual",
          externalSourceNotes: "Biennial event, not annual",
        },
      ],
    });
    const issues = checkCancelledEditions(event);
    expect(issues).toHaveLength(1);
    expect(issues[0].year).toBe(2014);
    expect(issues[0].message).toMatch(/biennial\/sub-annual cancellation support/);
  });

  it("accepts a valid cancellation between consecutive annual editions", () => {
    const event = makeEvent({
      historicalEditions: held(["2010-01-01", "2011-01-01", "2013-01-01"]),
      cancelledEditions: [
        {
          year: 2012,
          internalSourceNotes: "Skipped, organiser sabbatical",
          externalSourceNotes: "Skipped, organiser sabbatical",
        },
      ],
    });
    expect(checkCancelledEditions(event)).toEqual([]);
  });

  it("accepts multiple consecutive annual cancellations (COVID pattern)", () => {
    const event = makeEvent({
      historicalEditions: held(["2018-01-01", "2019-01-01", "2022-01-01", "2023-01-01"]),
      cancelledEditions: [
        {
          year: 2020,
          internalSourceNotes: "COVID",
          externalSourceNotes: "COVID",
        },
        {
          year: 2021,
          internalSourceNotes: "COVID continued",
          externalSourceNotes: "COVID continued",
        },
      ],
    });
    expect(checkCancelledEditions(event)).toEqual([]);
  });
});
