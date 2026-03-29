#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { parse as parseJsonc } from "jsonc-parser";
import {
  EVENT_SCHEMA,
  STATUS_VALUES,
  type IEventData,
  type TStatus,
} from "../schemas/event.schema";
import { deriveNextEditionDates } from "../src/lib/predictions";

const DATA_DIRECTORY = path.resolve(process.cwd(), "data/events");
const DEFAULT_REMINDER_OUTPUT_PATH = "/tmp/status-reminders.json";
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const STALE_DAYS_THRESHOLD = 90;
const ANNOUNCEMENT_WINDOW_DAYS_BEFORE = 14;
const ANNOUNCEMENT_WINDOW_DAYS_AFTER = 3;
const TICKET_WINDOW_DAYS_BEFORE = 7;
const TICKET_WINDOW_DAYS_AFTER = 2;

const VALID_STATUSES = new Set<TStatus>(STATUS_VALUES);
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateEventData = ajv.compile<IEventData>(EVENT_SCHEMA);

interface IReminder {
  type: "announcement_window" | "ticket_sale_window" | "stale_data";
  dedupeKey: string;
  eventName: string;
  eventSlug: string;
  title: string;
  body: string;
  labels: string[];
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetweenUtc(leftDate: Date, rightDate: Date): number {
  const leftMs = Date.UTC(
    leftDate.getUTCFullYear(),
    leftDate.getUTCMonth(),
    leftDate.getUTCDate(),
  );
  const rightMs = Date.UTC(
    rightDate.getUTCFullYear(),
    rightDate.getUTCMonth(),
    rightDate.getUTCDate(),
  );

  return Math.floor((leftMs - rightMs) / MS_PER_DAY);
}

function isWithinWindow(
  todayDate: Date,
  targetDate: Date,
  beforeDays: number,
  afterDays: number,
): boolean {
  const dayDelta = daysBetweenUtc(targetDate, todayDate);
  return dayDelta <= beforeDays && dayDelta >= -afterDays;
}

function ensureDirectoryForFile(filePath: string): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
}

function readJsoncFile(filePath: string): IEventData {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseJsonc(raw) as unknown;

  if (!validateEventData(parsed)) {
    const details = (validateEventData.errors || [])
      .map((error) => `${error.instancePath || "/"} ${error.message || "invalid"}`)
      .join("; ");
    throw new Error(`Schema validation failed for ${filePath}: ${details}`);
  }

  return parsed;
}

function writeJsonFile(filePath: string, data: IEventData): void {
  const serialized = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, serialized, "utf8");
}

function buildReminder({
  type,
  dedupeKey,
  eventName,
  eventSlug,
  title,
  details,
  labels = [],
}: {
  type: IReminder["type"];
  dedupeKey: string;
  eventName: string;
  eventSlug: string;
  title: string;
  details: string;
  labels?: string[];
}): IReminder {
  const allLabels = ["status-reminder", ...labels];
  const uniqueLabels = [...new Set(allLabels)];

  return {
    type,
    dedupeKey,
    eventName,
    eventSlug,
    title,
    body: [
      `Automated reminder for **${eventName}**.`,
      "",
      details,
      "",
      "- Review source links (website/FetLife/mailing list).",
      "- Update the corresponding data file if needed.",
      "- Close this issue once the event data is confirmed.",
    ].join("\n"),
    labels: uniqueLabels,
  };
}

function buildDedupeKey(reminderType: IReminder["type"], eventSlug: string, marker: string): string {
  return [reminderType, eventSlug, marker].join("::");
}

function collectReminders(eventData: IEventData, todayDate: Date): IReminder[] {
  const reminders: IReminder[] = [];
  const eventName = eventData.name;
  const eventSlug = eventData.slug;
  const derivedDates = deriveNextEditionDates(eventData);

  const announcementDate = derivedDates.announcementDate;
  if (
    announcementDate &&
    isWithinWindow(
      todayDate,
      announcementDate,
      ANNOUNCEMENT_WINDOW_DAYS_BEFORE,
      ANNOUNCEMENT_WINDOW_DAYS_AFTER,
    )
  ) {
    reminders.push(
      buildReminder({
        type: "announcement_window",
        dedupeKey: buildDedupeKey(
          "announcement_window",
          eventSlug,
          formatIsoDate(announcementDate),
        ),
        eventName,
        eventSlug,
        title: `[Reminder] ${eventName}: announcement window is open`,
        details: `This event is usually announced around **${formatIsoDate(announcementDate)}**. Check for updates to add to the website.`,
        labels: ["announcement-window"],
      }),
    );
  }

  const ticketSaleDate = derivedDates.ticketDate;
  if (
    ticketSaleDate &&
    isWithinWindow(
      todayDate,
      ticketSaleDate,
      TICKET_WINDOW_DAYS_BEFORE,
      TICKET_WINDOW_DAYS_AFTER,
    )
  ) {
    reminders.push(
      buildReminder({
        type: "ticket_sale_window",
        dedupeKey: buildDedupeKey(
          "ticket_sale_window",
          eventSlug,
          formatIsoDate(ticketSaleDate),
        ),
        eventName,
        eventSlug,
        title: `[Reminder] ${eventName}: ticket-sale window is open`,
        details: `Tickets are usually on sale around **${formatIsoDate(ticketSaleDate)}**. Verify and update event status.`,
        labels: ["ticket-window"],
      }),
    );
  }

  const lastUpdatedDate = parseIsoDate(eventData.lastUpdated);
  if (lastUpdatedDate) {
    const staleDays = daysBetweenUtc(todayDate, lastUpdatedDate);
    if (staleDays >= STALE_DAYS_THRESHOLD) {
      reminders.push(
        buildReminder({
          type: "stale_data",
          dedupeKey: buildDedupeKey("stale_data", eventSlug, formatIsoDate(lastUpdatedDate)),
          eventName,
          eventSlug,
          title: `[Reminder] ${eventName}: data stale (${staleDays} days)`,
          details: `This event was last updated on **${formatIsoDate(lastUpdatedDate)}** and may need fresh verification.`,
          labels: ["stale-data"],
        }),
      );
    }
  }

  return reminders;
}

function assertValidStatus(statusValue: string, eventName: string): void {
  if (VALID_STATUSES.has(statusValue as TStatus)) {
    return;
  }

  throw new Error(
    `Invalid status "${statusValue}" for event "${eventName}". Expected one of: ${[
      ...VALID_STATUSES,
    ].join(", ")}`,
  );
}

function computeUpdatedStatus(eventData: IEventData, todayDate: Date): TStatus {
  const nextEdition = eventData.nextEdition;
  const ticketSaleDate = parseIsoDate(nextEdition.ticketSaleDate);
  const eventName = eventData.name;
  const currentStatus = eventData.status || nextEdition.status || "scheduled";
  assertValidStatus(currentStatus, eventName);

  let updatedStatus = currentStatus;

  if (ticketSaleDate && todayDate >= ticketSaleDate && currentStatus === "scheduled") {
    updatedStatus = "on_sale";
  }

  return updatedStatus;
}

function updateEventData(
  eventData: IEventData,
  todayDate: Date,
): { changed: boolean; data: IEventData } {
  const updatedStatus = computeUpdatedStatus(eventData, todayDate);
  const oldStatus = eventData.status || null;
  const nextEdition = eventData.nextEdition;
  const oldNextStatus = nextEdition.status || null;

  const changed = updatedStatus !== oldStatus || updatedStatus !== oldNextStatus;
  if (!changed) {
    return { changed: false, data: eventData };
  }

  const updatedEventData: IEventData = {
    ...eventData,
    status: updatedStatus,
    lastUpdated: formatIsoDate(todayDate),
    nextEdition: {
      ...nextEdition,
      status: updatedStatus,
    },
  };

  return { changed: true, data: updatedEventData };
}

function main(): void {
  const todayDate = new Date();
  const reminderOutputPath = path.resolve(
    process.cwd(),
    process.env.REMINDER_OUTPUT_PATH || DEFAULT_REMINDER_OUTPUT_PATH,
  );

  const reminders: IReminder[] = [];
  const reminderKeys = new Set<string>();
  const changedFiles: string[] = [];

  if (!fs.existsSync(DATA_DIRECTORY)) {
    ensureDirectoryForFile(reminderOutputPath);
    fs.writeFileSync(reminderOutputPath, `${JSON.stringify([], null, 2)}\n`, "utf8");
    console.log("No data/events directory found. Wrote empty reminders list.");
    return;
  }

  const entries = fs
    .readdirSync(DATA_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonc"))
    .map((entry) => entry.name);

  for (const entryName of entries) {
    const filePath = path.join(DATA_DIRECTORY, entryName);
    const parsed = readJsoncFile(filePath);

    const eventReminders = collectReminders(parsed, todayDate);
    for (const reminder of eventReminders) {
      if (reminderKeys.has(reminder.dedupeKey)) {
        continue;
      }
      reminderKeys.add(reminder.dedupeKey);
      reminders.push(reminder);
    }

    const { changed, data } = updateEventData(parsed, todayDate);
    if (changed) {
      writeJsonFile(filePath, data);
      changedFiles.push(path.relative(process.cwd(), filePath));
    }
  }

  ensureDirectoryForFile(reminderOutputPath);
  fs.writeFileSync(reminderOutputPath, `${JSON.stringify(reminders, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        changedFiles,
        remindersCount: reminders.length,
        reminderOutputPath: path.relative(process.cwd(), reminderOutputPath),
      },
      null,
      2,
    ),
  );
}

main();
