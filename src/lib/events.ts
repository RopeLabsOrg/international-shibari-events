import { parse as parseJsonc } from "jsonc-parser";
import type { IEventData, TStatus } from "../../schemas/event.schema";
import { addDays, deriveNextEditionDates, getCadenceAndDuration, parseIsoDate } from "./predictions";
import type { IPredictionInfo } from "./predictions";

export type TTemporalState = "happening_now" | "upcoming" | "ended";
export type TSortKey = "eventDate" | "ticketDate" | "status" | "lastUpdated" | "name";

interface IResolvedDate {
  value: Date | null;
  isEstimated: boolean;
  source: "confirmed" | "estimated" | "missing";
}

export interface IEventSummary {
  event: IEventData;
  nextDate: IResolvedDate;
  endDate: IResolvedDate;
  ticketDate: IResolvedDate;
  temporalState: TTemporalState;
}

export interface IEditionDisplay {
  title: string;
  startDate: IResolvedDate;
  endDate: IResolvedDate;
  ticketDate: IResolvedDate;
  announcementDate: IResolvedDate;
  isEstimated: boolean;
  confidenceLabel: string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function resolveDate(confirmedDate: Date | null, estimatedDate: Date | null): IResolvedDate {
  if (confirmedDate) {
    return {
      value: confirmedDate,
      isEstimated: false,
      source: "confirmed",
    };
  }

  if (estimatedDate) {
    return {
      value: estimatedDate,
      isEstimated: true,
      source: "estimated",
    };
  }

  return {
    value: null,
    isEstimated: false,
    source: "missing",
  };
}

function getStatusPriority(status: TStatus): number {
  const priorityMap: Record<TStatus, number> = {
    on_sale: 0,
    waiting_list: 1,
    scheduled: 2,
    sold_out: 3,
    tba: 4,
  };

  return priorityMap[status];
}

function inferTemporalState(startDate: Date | null, endDate: Date | null, nowDate: Date): TTemporalState {
  if (!startDate) {
    return "upcoming";
  }

  const resolvedEndDate = endDate || startDate;
  if (startDate <= nowDate && resolvedEndDate >= nowDate) {
    return "happening_now";
  }

  if (startDate > nowDate) {
    return "upcoming";
  }

  return "ended";
}

function compareResolvedDate(leftDate: IResolvedDate, rightDate: IResolvedDate): number {
  if (leftDate.value && rightDate.value) {
    if (leftDate.isEstimated !== rightDate.isEstimated) {
      return leftDate.isEstimated ? 1 : -1;
    }
    return leftDate.value.getTime() - rightDate.value.getTime();
  }

  if (leftDate.value) {
    return -1;
  }

  if (rightDate.value) {
    return 1;
  }

  return 0;
}

export function formatDisplayDate(date: Date | null): string {
  if (!date) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate && !endDate) {
    return "TBA";
  }

  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  }

  return formatDisplayDate(startDate || endDate);
}

export function getEventSummaries(eventDataList: IEventData[], nowDate = new Date()): IEventSummary[] {
  return eventDataList.map((eventData) => {
    const nextEdition = eventData.nextEdition;
    const derivedDates = deriveNextEditionDates(eventData);
    const nextDate = resolveDate(parseIsoDate(nextEdition.startDate), derivedDates.startDate);
    const ticketDate = resolveDate(parseIsoDate(nextEdition.ticketSaleDate), derivedDates.ticketDate);
    const endDate = resolveDate(parseIsoDate(nextEdition.endDate), derivedDates.endDate);

    return {
      event: eventData,
      nextDate,
      endDate,
      ticketDate,
      temporalState: inferTemporalState(nextDate.value, endDate.value, nowDate),
    };
  });
}

export function sortEventSummaries(eventSummaries: IEventSummary[], sortKey: TSortKey): IEventSummary[] {
  const sorted = [...eventSummaries];

  sorted.sort((leftItem, rightItem) => {
    if (sortKey === "eventDate") {
      return compareResolvedDate(leftItem.nextDate, rightItem.nextDate);
    }

    if (sortKey === "ticketDate") {
      return compareResolvedDate(leftItem.ticketDate, rightItem.ticketDate);
    }

    if (sortKey === "status") {
      return getStatusPriority(leftItem.event.status) - getStatusPriority(rightItem.event.status);
    }

    if (sortKey === "lastUpdated") {
      const leftDate = parseIsoDate(leftItem.event.lastUpdated);
      const rightDate = parseIsoDate(rightItem.event.lastUpdated);
      if (leftDate && rightDate) {
        return rightDate.getTime() - leftDate.getTime();
      }
      if (leftDate) {
        return -1;
      }
      if (rightDate) {
        return 1;
      }
      return 0;
    }

    return leftItem.event.name.localeCompare(rightItem.event.name);
  });

  return sorted;
}

export function loadEventsData(): IEventData[] {
  const eventFileLoaders = import.meta.glob("/data/events/*.jsonc", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  return Object.entries(eventFileLoaders)
    .map(([, rawContents]) => parseJsonc(rawContents) as IEventData)
    .sort((leftEvent, rightEvent) => leftEvent.name.localeCompare(rightEvent.name));
}

export function buildEditionDisplays(event: IEventData): { editions: IEditionDisplay[]; prediction: IPredictionInfo } {
  const nextEdition = event.nextEdition;
  const prediction = getCadenceAndDuration(event);
  const derivedDates = deriveNextEditionDates(event);

  const currentEdition: IEditionDisplay = {
    title: "Next / current edition",
    startDate: resolveDate(parseIsoDate(nextEdition.startDate), derivedDates.startDate),
    endDate: resolveDate(parseIsoDate(nextEdition.endDate), derivedDates.endDate),
    ticketDate: resolveDate(parseIsoDate(nextEdition.ticketSaleDate), derivedDates.ticketDate),
    announcementDate: resolveDate(parseIsoDate(nextEdition.announcementDate), derivedDates.announcementDate),
    isEstimated: parseIsoDate(nextEdition.startDate) === null && derivedDates.startDate !== null,
    confidenceLabel: parseIsoDate(nextEdition.startDate)
      ? "Confirmed by source"
      : (derivedDates.startDate ? "Predicted from prior editions" : "Low confidence (limited history)"),
  };

  const baseStartDate = currentEdition.startDate.value;
  const predictedStartDate = baseStartDate ? addDays(baseStartDate, prediction.cadenceDays) : null;
  const predictedEndDate = predictedStartDate ? addDays(predictedStartDate, prediction.durationDays - 1) : null;
  const predictedTicketDate = predictedStartDate ? addDays(predictedStartDate, -prediction.ticketLeadDays) : null;
  const predictedAnnouncementDate = predictedStartDate
    ? addDays(predictedStartDate, -prediction.announcementLeadDays)
    : null;

  const secondEdition: IEditionDisplay = {
    title: "Following edition (forecast)",
    startDate: {
      value: predictedStartDate,
      isEstimated: true,
      source: predictedStartDate ? "estimated" : "missing",
    },
    endDate: {
      value: predictedEndDate,
      isEstimated: true,
      source: predictedEndDate ? "estimated" : "missing",
    },
    ticketDate: {
      value: predictedTicketDate,
      isEstimated: true,
      source: predictedTicketDate ? "estimated" : "missing",
    },
    announcementDate: {
      value: predictedAnnouncementDate,
      isEstimated: true,
      source: predictedAnnouncementDate ? "estimated" : "missing",
    },
    isEstimated: true,
    confidenceLabel: prediction.sampleSize > 0 ? "Forecast from event cadence" : "Low confidence (limited history)",
  };

  return {
    editions: [currentEdition, secondEdition],
    prediction,
  };
}

export function toIso(value: Date | null): string | null {
  if (!value) {
    return null;
  }

  return toIsoDate(value);
}
