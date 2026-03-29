import type { IEventData } from "../../schemas/event.schema";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_CADENCE_DAYS = 180;
const DEFAULT_DURATION_DAYS = 3;
const DEFAULT_ANNOUNCEMENT_LEAD_DAYS = 110;
const DEFAULT_TICKET_LEAD_DAYS = 75;

export interface IPredictionInfo {
  cadenceDays: number;
  durationDays: number;
  announcementLeadDays: number;
  ticketLeadDays: number;
  sampleSize: number;
  sourceNotes: string[];
}

export interface IDerivedNextEditionDates {
  startDate: Date | null;
  endDate: Date | null;
  announcementDate: Date | null;
  ticketDate: Date | null;
}

export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function addDays(baseDate: Date, days: number): Date {
  return new Date(baseDate.getTime() + days * MS_PER_DAY);
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

function getLatestHistoricalStartDate(event: IEventData): Date | null {
  const startDates = event.historicalEditions
    .map((edition) => parseIsoDate(edition.startDate))
    .filter((date): date is Date => Boolean(date));
  if (startDates.length === 0) {
    return null;
  }

  return startDates.reduce((latestDate, currentDate) => (
    currentDate.getTime() > latestDate.getTime() ? currentDate : latestDate
  ));
}

export function getCadenceAndDuration(event: IEventData): IPredictionInfo {
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

  const announcementLeadDays = editions
    .map((edition) => {
      const startDate = parseIsoDate(edition.startDate);
      const announcementDate = parseIsoDate(edition.announcementDate);
      if (!startDate || !announcementDate) {
        return null;
      }
      const leadDays = Math.round((startDate.getTime() - announcementDate.getTime()) / MS_PER_DAY);
      return leadDays >= 0 ? leadDays : null;
    })
    .filter((value): value is number => value !== null);

  const ticketLeadDays = editions
    .map((edition) => {
      const startDate = parseIsoDate(edition.startDate);
      const ticketDate = parseIsoDate(edition.ticketSaleDate);
      if (!startDate || !ticketDate) {
        return null;
      }
      const leadDays = Math.round((startDate.getTime() - ticketDate.getTime()) / MS_PER_DAY);
      return leadDays >= 0 ? leadDays : null;
    })
    .filter((value): value is number => value !== null);

  const sourceNotes = editions.map((edition) => edition.sourceNotes).filter((note) => note.trim().length > 0);

  return {
    cadenceDays: median(intervals) || DEFAULT_CADENCE_DAYS,
    durationDays: median(durations) || DEFAULT_DURATION_DAYS,
    announcementLeadDays: median(announcementLeadDays) || DEFAULT_ANNOUNCEMENT_LEAD_DAYS,
    ticketLeadDays: median(ticketLeadDays) || DEFAULT_TICKET_LEAD_DAYS,
    sampleSize: intervals.length,
    sourceNotes,
  };
}

export function deriveNextEditionDates(event: IEventData): IDerivedNextEditionDates {
  const prediction = getCadenceAndDuration(event);
  const nextEdition = event.nextEdition;

  const confirmedStartDate = parseIsoDate(nextEdition.startDate);
  const confirmedEndDate = parseIsoDate(nextEdition.endDate);
  const confirmedAnnouncementDate = parseIsoDate(nextEdition.announcementDate);
  const confirmedTicketDate = parseIsoDate(nextEdition.ticketSaleDate);

  const latestHistoricalStartDate = getLatestHistoricalStartDate(event);
  const estimatedStartDate = confirmedStartDate || (
    latestHistoricalStartDate ? addDays(latestHistoricalStartDate, prediction.cadenceDays) : null
  );
  const estimatedEndDate = estimatedStartDate ? addDays(estimatedStartDate, prediction.durationDays - 1) : null;
  const estimatedAnnouncementDate = estimatedStartDate
    ? addDays(estimatedStartDate, -prediction.announcementLeadDays)
    : null;
  const estimatedTicketDate = estimatedStartDate
    ? addDays(estimatedStartDate, -prediction.ticketLeadDays)
    : null;

  return {
    startDate: confirmedStartDate || estimatedStartDate,
    endDate: confirmedEndDate || estimatedEndDate,
    announcementDate: confirmedAnnouncementDate || estimatedAnnouncementDate,
    ticketDate: confirmedTicketDate || estimatedTicketDate,
  };
}
