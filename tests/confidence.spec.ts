import { describe, expect, it } from "vitest";
import type { IEventData } from "../schemas/event.schema";
import { formatEstimatedLabel, getEventSummaries } from "../src/lib/events";
import { classifyConfidence } from "../src/lib/predictions";

function makeEvent(slug: string, historicalStartDates: string[]): IEventData {
  return {
    name: slug,
    slug,
    location: { city: "City", country: "Country", venue: "Venue" },
    links: { website: null, fetlife: null, mailingList: null, contactEmail: null },
    status: "tba",
    lastUpdated: "2026-04-01",
    historicalEditions: historicalStartDates.map((startDate) => ({
      startDate,
      endDate: startDate,
      announcementDate: null,
      ticketSaleDate: null,
      soldOutDate: null,
      sourceNotes: "",
    })),
    nextEdition: {
      startDate: null,
      endDate: null,
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "tba",
    },
  };
}

describe("classifyConfidence", () => {
  it("sample size 0 = low (pure fallback cadence)", () => {
    expect(classifyConfidence(0)).toBe("low");
  });

  it("sample size 1 or 2 = medium (one or two observed intervals)", () => {
    expect(classifyConfidence(1)).toBe("medium");
    expect(classifyConfidence(2)).toBe("medium");
  });

  it("sample size 3+ = high (median over multiple intervals)", () => {
    expect(classifyConfidence(3)).toBe("high");
    expect(classifyConfidence(10)).toBe("high");
  });
});

describe("formatEstimatedLabel", () => {
  it("capitalises the confidence level after 'Estimated · '", () => {
    expect(formatEstimatedLabel("high")).toBe("Estimated · High");
    expect(formatEstimatedLabel("medium")).toBe("Estimated · Medium");
    expect(formatEstimatedLabel("low")).toBe("Estimated · Low");
  });
});

describe("getEventSummaries confidence field", () => {
  it("assigns low confidence when there are 0-1 historical editions", () => {
    const zero = getEventSummaries([makeEvent("zero", [])])[0];
    const one = getEventSummaries([makeEvent("one", ["2025-05-01"])])[0];
    expect(zero.confidence).toBe("low");
    expect(one.confidence).toBe("low");
  });

  it("assigns medium confidence with 2-3 historical editions (1-2 intervals)", () => {
    const two = getEventSummaries([makeEvent("two", ["2024-05-01", "2025-05-01"])])[0];
    const three = getEventSummaries([
      makeEvent("three", ["2023-05-01", "2024-05-01", "2025-05-01"]),
    ])[0];
    expect(two.confidence).toBe("medium");
    expect(three.confidence).toBe("medium");
  });

  it("assigns high confidence with 4+ historical editions (3+ intervals)", () => {
    const four = getEventSummaries([
      makeEvent("four", ["2022-05-01", "2023-05-01", "2024-05-01", "2025-05-01"]),
    ])[0];
    expect(four.confidence).toBe("high");
  });
});
