import { describe, expect, it } from "vitest";
import type { IEventData } from "../schemas/event.schema";
import { deriveNextEditionDates } from "../src/lib/predictions";

function makeEvent(historicalStarts: string[]): IEventData {
  return {
    name: "Test",
    slug: "test",
    location: { city: "Test", country: "Test", venue: "Test" },
    links: { website: null, fetlife: null, mailingList: null, contactEmail: null },
    status: "scheduled",
    lastUpdated: "2026-04-27",
    historicalEditions: historicalStarts.map((startDate) => ({
      startDate,
      endDate: startDate,
      announcementDate: null,
      ticketSaleDate: null,
      soldOutDate: null,
      internalSourceNotes: "",
      externalSourceNotes: "Test edition.",
    })),
    nextEdition: {
      startDate: null,
      endDate: null,
      announcementDate: null,
      ticketSaleDate: null,
      ticketUrl: null,
      status: "scheduled",
    },
  };
}

describe("dormancy cap interaction with reminder workflow (SC19, SC20)", () => {
  it("dormant event: derived dates are all null so update-statuses null-checks suppress reminders (SC19)", () => {
    const event = makeEvent(["2018-01-01"]);
    const today = new Date("2026-04-27T00:00:00Z");
    const derived = deriveNextEditionDates(event, today);
    expect(derived.startDate).toBeNull();
    expect(derived.announcementDate).toBeNull();
    expect(derived.ticketDate).toBeNull();
    expect(derived.endDate).toBeNull();
  });

  it("active event: derived dates are populated so reminder-window checks can fire normally (SC20)", () => {
    const event = makeEvent(["2024-10-15", "2025-10-15"]);
    const today = new Date("2026-08-01T00:00:00Z");
    const derived = deriveNextEditionDates(event, today);
    expect(derived.startDate).not.toBeNull();
    expect(derived.startDate?.getUTCFullYear()).toBe(2026);
    expect(derived.announcementDate).not.toBeNull();
    expect(derived.ticketDate).not.toBeNull();
  });

  it("borderline event (latest 1 cycle ago): still produces a future prediction within cap", () => {
    const event = makeEvent(["2024-01-01", "2025-01-01"]);
    const today = new Date("2025-09-01T00:00:00Z");
    const derived = deriveNextEditionDates(event, today);
    expect(derived.startDate).not.toBeNull();
    expect(derived.startDate?.getUTCFullYear()).toBeGreaterThanOrEqual(2025);
  });
});
