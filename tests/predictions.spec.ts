import { describe, expect, it } from "vitest";
import type { IEventData } from "../schemas/event.schema";
import {
  buildIntervals,
  clusterIntervals,
  detectBaseCadence,
  deriveNextEditionDates,
  getCadenceAndDuration,
  parseIsoDate,
} from "../src/lib/predictions";

function makeEvent(overrides: Partial<IEventData> = {}): IEventData {
  return {
    name: "Test Event",
    slug: "test-event",
    location: { city: "Test", country: "Test", venue: "Test" },
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

function dates(...isoDates: string[]): Date[] {
  return isoDates.map((iso) => parseIsoDate(iso) as Date);
}

function historicalEditions(starts: string[], ends?: string[]): IEventData["historicalEditions"] {
  return starts.map((startDate, index) => ({
    startDate,
    endDate: ends?.[index] ?? startDate,
    announcementDate: null,
    ticketSaleDate: null,
    soldOutDate: null,
    sourceNotes: "",
  }));
}

describe("clusterIntervals", () => {
  it("groups intervals within tolerance into one cluster", () => {
    const clusters = clusterIntervals([363, 365, 371]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].values).toHaveLength(3);
  });

  it("splits intervals exceeding tolerance into separate clusters", () => {
    const clusters = clusterIntervals([365, 731]);
    expect(clusters).toHaveLength(2);
  });

  it("is order-independent (deterministic centroid)", () => {
    const a = clusterIntervals([365, 731, 366]);
    const b = clusterIntervals([731, 366, 365]);
    expect(a.length).toBe(b.length);
    expect(a.map((c) => Math.round(c.center)).sort()).toEqual(
      b.map((c) => Math.round(c.center)).sort(),
    );
  });

  it("returns empty array for empty input", () => {
    expect(clusterIntervals([])).toEqual([]);
  });
});

describe("detectBaseCadence", () => {
  it("returns null for empty input", () => {
    expect(detectBaseCadence([])).toBeNull();
  });

  it("returns the single interval rounded for one input", () => {
    expect(detectBaseCadence([365.5])).toBe(366);
  });

  it("detects annual cadence with one missing edition (SC1)", () => {
    expect(detectBaseCadence([365, 731])).toBe(365);
  });

  it("detects annual cadence with COVID-style triple gap (SC2 input)", () => {
    expect(detectBaseCadence([365, 1096, 365])).toBe(365);
  });

  it("returns biennial when intervals are biennial (SC5)", () => {
    expect(detectBaseCadence([731, 731])).toBe(731);
  });

  it("rejects 1.5x ratio as not a clean multiple (SC10)", () => {
    expect(detectBaseCadence([1096, 731, 731])).toBeNull();
  });

  it("handles drift within tolerance for the SC9 EURIX shape", () => {
    const result = detectBaseCadence([364, 371]);
    expect(result).toBeGreaterThanOrEqual(365);
    expect(result).toBeLessThanOrEqual(368);
  });

  it("handles a 4x silent gap (SC11 silent multi-year)", () => {
    expect(detectBaseCadence([365, 365, 1461])).toBe(365);
  });
});

describe("buildIntervals", () => {
  it("produces raw intervals when no cancellations", () => {
    const intervals = buildIntervals(dates("2010-01-01", "2011-01-01", "2013-01-01"), []);
    expect(intervals).toEqual([365, 731]);
  });

  it("splits an annual gap when one cancelled year is between (SC2 with metadata)", () => {
    const intervals = buildIntervals(
      dates("2010-01-01", "2011-01-01", "2013-01-01"),
      [2012],
    );
    expect(intervals.length).toBe(3);
    expect(intervals[0]).toBe(365);
    expect(intervals[1]).toBeCloseTo(365.5, 1);
    expect(intervals[2]).toBeCloseTo(365.5, 1);
  });

  it("splits a COVID gap when two cancelled years bracket (SC4)", () => {
    const intervals = buildIntervals(
      dates("2018-01-01", "2019-01-01", "2022-01-01", "2023-01-01"),
      [2020, 2021],
    );
    expect(intervals.length).toBe(5);
    expect(intervals[0]).toBe(365);
    expect(intervals[4]).toBe(365);
  });

  it("ignores cancellation metadata when gap doesn't fit annual periods (SC6 biennial)", () => {
    const intervals = buildIntervals(
      dates("2010-01-01", "2012-01-01", "2016-01-01"),
      [2014],
    );
    // 2010→2012 = 730 (2011 non-leap + 2010 non-leap days). 2012→2016 = 1461 (one leap year).
    expect(intervals).toEqual([730, 1461]);
  });

  it("skips zero-or-negative deltas defensively", () => {
    const intervals = buildIntervals(dates("2024-01-01", "2024-01-01"), []);
    expect(intervals).toEqual([]);
  });
});

describe("getCadenceAndDuration", () => {
  it("predicts annual cadence when one edition cancelled (SC1, no metadata)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(
        ["2010-01-01", "2011-01-01", "2013-01-01"],
        ["2010-01-03", "2011-01-03", "2013-01-03"],
      ),
    });
    const result = getCadenceAndDuration(event);
    expect(result.cadenceDays).toBe(365);
  });

  it("predicts annual cadence with metadata-informed split (SC2)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2010-01-01", "2011-01-01", "2013-01-01"]),
      cancelledEditions: [{ year: 2012, sourceNotes: "Cancelled by organizer." }],
    });
    expect(getCadenceAndDuration(event).cadenceDays).toBe(365);
  });

  it("predicts annual cadence on COVID fixture (SC3, no metadata)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions([
        "2018-01-01",
        "2019-01-01",
        "2022-01-01",
        "2023-01-01",
      ]),
    });
    expect(getCadenceAndDuration(event).cadenceDays).toBe(365);
  });

  it("respects biennial cadence (SC5)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2020-01-01", "2022-01-01", "2024-01-01"]),
    });
    expect(getCadenceAndDuration(event).cadenceDays).toBe(731);
  });

  it("falls back to median when intervals are irregular (SC7)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions([
        "2010-01-01",
        "2011-06-15",
        "2012-01-01",
        "2014-01-01",
        "2015-01-01",
      ]),
    });
    const result = getCadenceAndDuration(event);
    expect(result.cadenceDays).toBeGreaterThan(0);
    expect(result.cadenceDays).not.toBe(180);
  });

  it("uses defaults for single-edition event (SC8)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2025-01-01"]),
    });
    expect(getCadenceAndDuration(event).cadenceDays).toBe(180);
  });

  it("matches EURIX-shaped drift within +/- 7 days (SC9)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(
        ["2023-10-16", "2024-10-14", "2025-10-20"],
        ["2023-10-21", "2024-10-19", "2025-10-25"],
      ),
    });
    const cadence = getCadenceAndDuration(event).cadenceDays;
    expect(cadence).toBeGreaterThanOrEqual(361);
    expect(cadence).toBeLessThanOrEqual(372);
  });
});

describe("deriveNextEditionDates", () => {
  it("uses confirmed nextEdition.startDate when present", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2024-01-01", "2025-01-01"]),
      nextEdition: {
        startDate: "2026-06-01",
        endDate: "2026-06-03",
        announcementDate: null,
        ticketSaleDate: null,
        ticketUrl: null,
        status: "scheduled",
      },
    });
    const result = deriveNextEditionDates(event, new Date("2026-04-01T00:00:00Z"));
    expect(result.startDate?.toISOString().slice(0, 10)).toBe("2026-06-01");
  });

  it("projects forward by cadence when no nextEdition.startDate", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2021-01-01", "2022-01-01"]),
    });
    const result = deriveNextEditionDates(event, new Date("2022-06-01T00:00:00Z"));
    expect(result.startDate?.toISOString().slice(0, 10)).toBe("2023-01-01");
  });

  it("advances forward through one dormancy cycle to reach today (SC12 past-prediction guard)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2021-01-01", "2022-01-01"]),
    });
    const result = deriveNextEditionDates(event, new Date("2023-06-01T00:00:00Z"));
    expect(result.startDate?.toISOString().slice(0, 10)).toBe("2024-01-01");
  });

  it("returns null when forward-projection exceeds dormancy cap (SC19 dormant event)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2018-01-01"]),
    });
    const result = deriveNextEditionDates(event, new Date("2026-04-27T00:00:00Z"));
    expect(result.startDate).toBeNull();
    expect(result.announcementDate).toBeNull();
    expect(result.ticketDate).toBeNull();
  });

  it("does not infinite-loop when cadence is suspiciously zero (defensive)", () => {
    const event = makeEvent({
      historicalEditions: historicalEditions(["2024-01-01", "2024-01-01"]),
    });
    const result = deriveNextEditionDates(event, new Date("2026-04-27T00:00:00Z"));
    expect(result.startDate).not.toBeUndefined();
  });
});
