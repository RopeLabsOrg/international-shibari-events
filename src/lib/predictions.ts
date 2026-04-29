import type { IEventData } from "../../schemas/event.schema";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_CADENCE_DAYS = 180;
const DEFAULT_DURATION_DAYS = 3;
const DEFAULT_ANNOUNCEMENT_LEAD_DAYS = 110;
const DEFAULT_TICKET_LEAD_DAYS = 75;
const CLUSTER_TOLERANCE_DAYS = 14;
const MULTIPLE_DRIFT_DAYS_PER_PERIOD = 14;
const DAYS_PER_YEAR = 365.25;
const DORMANCY_CADENCE_CYCLES = 2;

export interface IPredictionInfo {
  cadenceDays: number;
  durationDays: number;
  announcementLeadDays: number;
  ticketLeadDays: number;
  sampleSize: number;
  sourceNotes: string[];
}

export type TConfidenceLevel = "high" | "medium" | "low";

export function classifyConfidence(sampleSize: number): TConfidenceLevel {
  if (sampleSize >= 3) return "high";
  if (sampleSize >= 1) return "medium";
  return "low";
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

interface IIntervalCluster {
  values: number[];
  center: number;
}

export function buildIntervals(
  startDates: Date[],
  cancelledYears: number[],
): number[] {
  const intervals: number[] = [];
  for (let index = 1; index < startDates.length; index += 1) {
    const previous = startDates[index - 1];
    const current = startDates[index];
    const rawDelta = Math.round((current.getTime() - previous.getTime()) / MS_PER_DAY);
    if (rawDelta <= 0) {
      continue;
    }

    const previousYear = previous.getUTCFullYear();
    const currentYear = current.getUTCFullYear();
    const cancelledBetween = cancelledYears.filter(
      (year) => year > previousYear && year < currentYear,
    ).length;

    if (cancelledBetween > 0) {
      const expectedPeriods = cancelledBetween + 1;
      const expectedDelta = expectedPeriods * DAYS_PER_YEAR;
      const driftBudget = MULTIPLE_DRIFT_DAYS_PER_PERIOD * expectedPeriods;
      if (Math.abs(rawDelta - expectedDelta) <= driftBudget) {
        const splitInterval = rawDelta / expectedPeriods;
        for (let part = 0; part < expectedPeriods; part += 1) {
          intervals.push(splitInterval);
        }
        continue;
      }
    }

    intervals.push(rawDelta);
  }
  return intervals;
}

export function clusterIntervals(intervals: number[]): IIntervalCluster[] {
  const sorted = [...intervals].sort((leftValue, rightValue) => leftValue - rightValue);
  const clusters: IIntervalCluster[] = [];
  for (const interval of sorted) {
    const matched = clusters.find(
      (cluster) => Math.abs(interval - cluster.center) <= CLUSTER_TOLERANCE_DAYS,
    );
    if (matched) {
      matched.values.push(interval);
      matched.center =
        matched.values.reduce((sum, value) => sum + value, 0) / matched.values.length;
    } else {
      clusters.push({ values: [interval], center: interval });
    }
  }
  return clusters;
}

export function detectBaseCadence(intervals: number[]): number | null {
  if (intervals.length === 0) {
    return null;
  }
  if (intervals.length === 1) {
    return Math.round(intervals[0]);
  }

  const clusters = clusterIntervals(intervals).sort(
    (leftCluster, rightCluster) => leftCluster.center - rightCluster.center,
  );
  const base = clusters[0].center;
  if (base <= 0) {
    return null;
  }

  for (const cluster of clusters) {
    const ratio = cluster.center / base;
    const nearestInteger = Math.round(ratio);
    if (nearestInteger < 1) {
      return null;
    }
    const expected = nearestInteger * base;
    const driftBudget = MULTIPLE_DRIFT_DAYS_PER_PERIOD * nearestInteger;
    if (Math.abs(cluster.center - expected) > driftBudget) {
      return null;
    }
  }

  return Math.round(base);
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
  const starts = editions
    .map((edition) => parseIsoDate(edition.startDate))
    .filter((date): date is Date => Boolean(date))
    .sort((leftDate, rightDate) => leftDate.getTime() - rightDate.getTime());
  const cancelledYears = (event.cancelledEditions ?? []).map((entry) => entry.year);
  const intervals = buildIntervals(starts, cancelledYears);

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

  const detectedCadence = detectBaseCadence(intervals);
  const fallbackCadence = intervals.length > 0 ? median(intervals) : 0;
  const cadenceDays =
    detectedCadence ?? (fallbackCadence > 0 ? fallbackCadence : DEFAULT_CADENCE_DAYS);

  return {
    cadenceDays,
    durationDays: median(durations) || DEFAULT_DURATION_DAYS,
    announcementLeadDays: median(announcementLeadDays) || DEFAULT_ANNOUNCEMENT_LEAD_DAYS,
    ticketLeadDays: median(ticketLeadDays) || DEFAULT_TICKET_LEAD_DAYS,
    sampleSize: intervals.length,
    sourceNotes,
  };
}

function projectForwardWithDormancyCap(
  latestHistoricalStartDate: Date,
  cadenceDays: number,
  today: Date,
): Date | null {
  if (cadenceDays <= 0) {
    return latestHistoricalStartDate;
  }
  let candidate = addDays(latestHistoricalStartDate, cadenceDays);
  let cyclesAdvanced = 1;
  while (candidate < today && cyclesAdvanced < DORMANCY_CADENCE_CYCLES) {
    candidate = addDays(candidate, cadenceDays);
    cyclesAdvanced += 1;
  }
  if (candidate < today) {
    return null;
  }
  return candidate;
}

export function deriveNextEditionDates(
  event: IEventData,
  nowDate: Date = new Date(),
): IDerivedNextEditionDates {
  const prediction = getCadenceAndDuration(event);
  const nextEdition = event.nextEdition;

  const confirmedStartDate = parseIsoDate(nextEdition.startDate);
  const confirmedEndDate = parseIsoDate(nextEdition.endDate);
  const confirmedAnnouncementDate = parseIsoDate(nextEdition.announcementDate);
  const confirmedTicketDate = parseIsoDate(nextEdition.ticketSaleDate);

  const latestHistoricalStartDate = getLatestHistoricalStartDate(event);
  const estimatedStartDate = confirmedStartDate || (
    latestHistoricalStartDate
      ? projectForwardWithDormancyCap(latestHistoricalStartDate, prediction.cadenceDays, nowDate)
      : null
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
