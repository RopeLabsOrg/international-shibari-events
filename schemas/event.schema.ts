import type { FromSchema } from "json-schema-to-ts";

export const STATUS_VALUES = [
  "scheduled",
  "on_sale",
  "sold_out",
  "waiting_list",
  "tba",
] as const;

const LINK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["website", "fetlife", "mailingList", "contactEmail"],
  properties: {
    website: { type: ["string", "null"], format: "uri" },
    fetlife: { type: ["string", "null"], format: "uri" },
    mailingList: { type: ["string", "null"], format: "uri" },
    contactEmail: { type: ["string", "null"], format: "email" },
  },
} as const;

const LOCATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["city", "country", "venue"],
  properties: {
    city: { type: "string", minLength: 1 },
    country: { type: "string", minLength: 1 },
    venue: { type: "string", minLength: 1 },
  },
} as const;

const HISTORICAL_EDITION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["startDate", "endDate", "sourceNotes"],
  properties: {
    startDate: { type: "string", format: "date" },
    endDate: { type: "string", format: "date" },
    announcementDate: { type: ["string", "null"], format: "date" },
    ticketSaleDate: { type: ["string", "null"], format: "date" },
    soldOutDate: { type: ["string", "null"], format: "date" },
    sourceNotes: { type: "string" },
  },
} as const;

const NEXT_EDITION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["isEstimated", "status"],
  properties: {
    isEstimated: { type: "boolean" },
    startDate: { type: ["string", "null"], format: "date" },
    endDate: { type: ["string", "null"], format: "date" },
    estimatedStartDate: { type: ["string", "null"], format: "date" },
    estimatedEndDate: { type: ["string", "null"], format: "date" },
    announcementDate: { type: ["string", "null"], format: "date" },
    estimatedAnnouncementDate: { type: ["string", "null"], format: "date" },
    ticketSaleDate: { type: ["string", "null"], format: "date" },
    estimatedTicketSaleDate: { type: ["string", "null"], format: "date" },
    ticketUrl: { type: ["string", "null"], format: "uri" },
    status: { type: "string", enum: [...STATUS_VALUES] },
  },
} as const;

export const EVENT_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://shibari-events/schemas/event.schema.json",
  type: "object",
  additionalProperties: false,
  required: [
    "name",
    "slug",
    "location",
    "links",
    "status",
    "lastUpdated",
    "historicalEditions",
    "nextEdition",
  ],
  properties: {
    name: { type: "string", minLength: 1 },
    slug: {
      type: "string",
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      minLength: 1,
    },
    location: LOCATION_SCHEMA,
    links: LINK_SCHEMA,
    status: { type: "string", enum: [...STATUS_VALUES] },
    lastUpdated: { type: "string", format: "date" },
    historicalEditions: {
      type: "array",
      items: HISTORICAL_EDITION_SCHEMA,
    },
    nextEdition: NEXT_EDITION_SCHEMA,
  },
} as const;

export type TStatus = (typeof STATUS_VALUES)[number];
export type IEventData = FromSchema<typeof EVENT_SCHEMA>;
