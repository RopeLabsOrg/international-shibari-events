import { parseTree, createScanner, SyntaxKind } from "jsonc-parser";
import type { IEventData } from "../schemas/event.schema";

export function findExtraRootValueOffset(raw: string): number | null {
  const tree = parseTree(raw, [], { allowTrailingComma: true });
  if (!tree) return null;
  const firstEnd = tree.offset + tree.length;
  const remainder = raw.substring(firstEnd);
  const scanner = createScanner(remainder, true);
  const kind = scanner.scan();
  if (kind === SyntaxKind.EOF) return null;
  return firstEnd + scanner.getTokenOffset();
}

const DAYS_PER_YEAR = 365.25;
const PER_PERIOD_DRIFT_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface ICancelledEditionIssue {
  year: number;
  message: string;
}

function getHeldStartYears(historicalEditions: IEventData["historicalEditions"]): number[] {
  return historicalEditions
    .map((edition) => {
      const date = new Date(`${edition.startDate}T00:00:00Z`);
      return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
    })
    .filter((year): year is number => year !== null);
}

export function checkCancelledEditions(event: IEventData): ICancelledEditionIssue[] {
  const cancelled = event.cancelledEditions;
  if (!cancelled || cancelled.length === 0) {
    return [];
  }

  const issues: ICancelledEditionIssue[] = [];
  const heldYears = getHeldStartYears(event.historicalEditions);
  const heldYearSet = new Set(heldYears);
  const sortedHeldStarts = event.historicalEditions
    .map((edition) => new Date(`${edition.startDate}T00:00:00Z`))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((leftDate, rightDate) => leftDate.getTime() - rightDate.getTime());

  const earliestHeldYear = heldYears.length > 0 ? Math.min(...heldYears) : null;
  const latestHeldYear = heldYears.length > 0 ? Math.max(...heldYears) : null;

  for (const entry of cancelled) {
    const year = entry.year;

    if (heldYearSet.has(year)) {
      issues.push({
        year,
        message: `cancelled year ${year} matches the year of a held edition; an event cannot be both held and cancelled in the same year.`,
      });
      continue;
    }

    if (
      earliestHeldYear === null ||
      latestHeldYear === null ||
      year < earliestHeldYear ||
      year > latestHeldYear
    ) {
      issues.push({
        year,
        message: `cancelled year ${year} is outside the range of held editions [${earliestHeldYear ?? "?"}-${latestHeldYear ?? "?"}]; recorded cancellations must fall between known active years.`,
      });
      continue;
    }

    let bracketingPair: [Date, Date] | null = null;
    for (let index = 1; index < sortedHeldStarts.length; index += 1) {
      const previousYear = sortedHeldStarts[index - 1].getUTCFullYear();
      const currentYear = sortedHeldStarts[index].getUTCFullYear();
      if (year > previousYear && year < currentYear) {
        bracketingPair = [sortedHeldStarts[index - 1], sortedHeldStarts[index]];
        break;
      }
    }

    if (!bracketingPair) {
      issues.push({
        year,
        message: `cancelled year ${year} cannot be bracketed by two consecutive held editions; recorded cancellations must fall in a gap between two held editions.`,
      });
      continue;
    }

    const [previous, current] = bracketingPair;
    const previousYearOfPair = previous.getUTCFullYear();
    const currentYearOfPair = current.getUTCFullYear();
    const cancelledBetween = cancelled.filter(
      (other) => other.year > previousYearOfPair && other.year < currentYearOfPair,
    ).length;
    const expectedPeriods = cancelledBetween + 1;
    const expectedDelta = expectedPeriods * DAYS_PER_YEAR;
    const driftBudget = PER_PERIOD_DRIFT_DAYS * expectedPeriods;
    const actualDelta = Math.round((current.getTime() - previous.getTime()) / MS_PER_DAY);

    if (Math.abs(actualDelta - expectedDelta) > driftBudget) {
      issues.push({
        year,
        message: `cancelled year ${year} cannot be reconciled with annual cadence between ${previousYearOfPair} and ${currentYearOfPair} (gap of ${actualDelta} days, expected ~${Math.round(expectedDelta)} days for ${expectedPeriods} annual period(s)). Year-based cancellation metadata only supports annual events; open an issue if you need biennial/sub-annual cancellation support.`,
      });
    }
  }

  return issues;
}
