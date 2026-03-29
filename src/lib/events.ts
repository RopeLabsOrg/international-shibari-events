import { parse as parseJsonc } from "jsonc-parser";
import type { IEventData, TStatus } from "../../schemas/event.schema";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_CADENCE_DAYS = 180;
const DEFAULT_DURATION_DAYS = 3;

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

export interface IPredictionInfo {
  cadenceDays: number;
  durationDays: number;
  sampleSize: number;
  sourceNotes: string[];
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function addDays(baseDate: Date, days: number): Date {
  return new Date(baseDate.getTime() + days * MS_PER_DAY);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((leftValue, rightValue) => leftValue - rightValue);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function resolveDate(confirmedDate: string | null | undefined, estimatedDate: string | null | undefined): IResolvedDate {
  const confirmed = parseIsoDate(confirmedDate);
  if (confirmed) {
    return {
      value: confirmed,
      isEstimated: false,
      source: "confirmed",
    };
  }

  const estimated = parseIsoDate(estimatedDate);
  if (estimated) {
    return {
      value: estimated,
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

function getCadenceAndDuration(event: IEventData): IPredictionInfo {
  const editions = [...event.historicalEditions];
  const starts = editions.map((edition) => parseIsoDate(edition.startDate)).filter((date): date is Date => Boolean(date));
  const intervals: number[] = [];

  for (let index = 1; index < starts.length; index += 1) {
    const deltaDays = Math.round((starts[index].getTime() - starts[index - 1].getTime()) / MS_PER_DAY);
    if (deltaDays > 0) {
      intervals.push(deltaDays);
    }
  }

  const durations = editions
    .map((edition) => {
      const startDate = parseIsoDate(edition.startDate);
      const endDate = parseIsoDate(edition.endDate);
      if (!startDate || !endDate) {
        return null;
      }
      return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1);
    })
    .filter((value): value is number => value !== null);

  const sourceNotes = editions.map((edition) => edition.sourceNotes).filter((note) => note.trim().length > 0);

  return {
    cadenceDays: median(intervals) || DEFAULT_CADENCE_DAYS,
    durationDays: median(durations) || DEFAULT_DURATION_DAYS,
    sampleSize: intervals.length,
    sourceNotes,
  };
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
    const nextDate = resolveDate(nextEdition.startDate, nextEdition.estimatedStartDate);
    const ticketDate = resolveDate(nextEdition.ticketSaleDate, nextEdition.estimatedTicketSaleDate);
    const endDate = resolveDate(nextEdition.endDate, nextEdition.estimatedEndDate);

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

  const currentEdition: IEditionDisplay = {
    title: "Next / current edition",
    startDate: resolveDate(nextEdition.startDate, nextEdition.estimatedStartDate),
    endDate: resolveDate(nextEdition.endDate, nextEdition.estimatedEndDate),
    ticketDate: resolveDate(nextEdition.ticketSaleDate, nextEdition.estimatedTicketSaleDate),
    announcementDate: resolveDate(nextEdition.announcementDate, nextEdition.estimatedAnnouncementDate),
    isEstimated: nextEdition.isEstimated,
    confidenceLabel: nextEdition.isEstimated ? "Predicted from prior editions" : "Confirmed by source",
  };

  const baseStartDate = currentEdition.startDate.value;
  const predictedStartDate = baseStartDate
    ? addDays(baseStartDate, prediction.cadenceDays)
    : parseIsoDate(nextEdition.estimatedStartDate);
  const predictedEndDate = predictedStartDate ? addDays(predictedStartDate, prediction.durationDays - 1) : null;
  const predictedTicketDate = predictedStartDate ? addDays(predictedStartDate, -75) : null;
  const predictedAnnouncementDate = predictedStartDate ? addDays(predictedStartDate, -110) : null;

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
