#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import { parse as parseJsonc } from "jsonc-parser";
import { EVENT_SCHEMA, type IEventData } from "../schemas/event.schema";
import { findExtraRootValueOffset } from "./validate-events-lib";

const DATA_DIRECTORY = path.resolve(process.cwd(), "data/events");
const SLUG_HISTORY_PATH = path.resolve(process.cwd(), "data/slug-history.jsonc");
const TEMPLATE_PATH = "data/event-template.jsonc";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateEventData = ajv.compile<IEventData>(EVENT_SCHEMA);

interface IPosition {
  line: number;
  col: number;
}

function offsetToPosition(raw: string, offset: number): IPosition {
  let line = 1;
  let col = 1;
  for (let index = 0; index < offset && index < raw.length; index++) {
    if (raw[index] === "\n") {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, col };
}

function fixHintFor(error: ErrorObject): string {
  const keyword = error.keyword;
  switch (keyword) {
    case "required": {
      const missing = (error.params as { missingProperty: string }).missingProperty;
      return `Add missing field "${missing}". See ${TEMPLATE_PATH} for an example.`;
    }
    case "format": {
      const format = (error.params as { format: string }).format;
      if (format === "date") return `Expected ISO date (YYYY-MM-DD) or null. Example: "2026-07-04"`;
      if (format === "uri") return `Expected an absolute URL or null. Example: "https://example.com/events/123"`;
      if (format === "email") return `Expected an email address or null. Example: "info@example.com"`;
      return `Value must match the "${format}" format.`;
    }
    case "type": {
      const expectedType = (error.params as { type: string | string[] }).type;
      const typeString = Array.isArray(expectedType) ? expectedType.join(" | ") : expectedType;
      return `Type must be ${typeString}. See ${TEMPLATE_PATH} for the expected shape.`;
    }
    case "enum": {
      const allowed = (error.params as { allowedValues: unknown[] }).allowedValues;
      return `Value must be one of: ${allowed.map((value) => JSON.stringify(value)).join(", ")}`;
    }
    case "additionalProperties": {
      const prop = (error.params as { additionalProperty: string }).additionalProperty;
      return `Unknown field "${prop}". Remove it or check for typos — compare with ${TEMPLATE_PATH}.`;
    }
    case "pattern":
      return `Value does not match the required pattern. For slugs: lowercase letters, digits, and hyphens only (e.g., "prague-shibari-festival").`;
    case "minLength":
      return `Value must not be empty.`;
    default:
      return `See ${TEMPLATE_PATH} for the expected shape.`;
  }
}

function validateFile(filePath: string, raw: string): string[] {
  const relPath = path.relative(process.cwd(), filePath);

  const extraAt = findExtraRootValueOffset(raw);
  if (extraAt !== null) {
    const position = offsetToPosition(raw, extraAt);
    return [
      `${relPath}:${position.line}:${position.col} — file contains more than one top-level JSON value.\n  Each event file must contain exactly ONE event object. Merge the duplicate records or split them into separate files.`,
    ];
  }

  const parsed = parseJsonc(raw) as unknown;
  if (validateEventData(parsed)) return [];

  return (validateEventData.errors || []).map((error) => {
    const pointer = error.instancePath || "/";
    const hint = fixHintFor(error);
    return `${relPath}: ${pointer} ${error.message || "invalid"}\n  Hint: ${hint}`;
  });
}

interface ISlugHistory {
  active: string[];
  retired: string[];
}

function loadSlugHistory(): ISlugHistory | null {
  if (!fs.existsSync(SLUG_HISTORY_PATH)) return null;
  const raw = fs.readFileSync(SLUG_HISTORY_PATH, "utf8");
  const parsed = parseJsonc(raw) as Partial<ISlugHistory> | null;
  return {
    active: parsed?.active ?? [],
    retired: parsed?.retired ?? [],
  };
}

function checkSlugHistory(activeSlugs: string[]): string[] {
  const history = loadSlugHistory();
  if (!history) {
    return [
      `data/slug-history.jsonc: file is missing.\n  This ledger tracks every slug ever shipped (user watchlists depend on slug stability). Create it with an "active" array containing all current slugs and an empty "retired" array.`,
    ];
  }
  const known = new Set([...history.active, ...history.retired]);
  const errors: string[] = [];
  for (const slug of activeSlugs) {
    if (!known.has(slug)) {
      errors.push(
        `data/slug-history.jsonc: slug "${slug}" is in data/events/ but not in the ledger.\n  Append "${slug}" to the "active" array. Slugs are load-bearing: renaming one silently breaks the watchlists stored in real users' browsers.`,
      );
    }
  }
  return errors;
}

function main(): void {
  if (!fs.existsSync(DATA_DIRECTORY)) {
    console.log("No data/events directory found. Skipping validation.");
    return;
  }

  const eventFiles = fs
    .readdirSync(DATA_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonc") && !entry.name.startsWith("_"))
    .map((entry) => path.join(DATA_DIRECTORY, entry.name));

  const errors: string[] = [];
  const activeSlugs: string[] = [];

  for (const filePath of eventFiles) {
    const raw = fs.readFileSync(filePath, "utf8");
    const fileErrors = validateFile(filePath, raw);
    errors.push(...fileErrors);
    if (fileErrors.length === 0) {
      const parsed = parseJsonc(raw) as Partial<IEventData> | null;
      if (parsed?.slug) activeSlugs.push(parsed.slug);
    }
  }

  errors.push(...checkSlugHistory(activeSlugs));

  if (errors.length > 0) {
    console.error("Event data validation failed:\n");
    for (const error of errors) {
      console.error(`- ${error}\n`);
    }
    console.error(`See ${TEMPLATE_PATH} for the canonical event shape.`);
    console.error(`For contributor guidance, read CONTRIBUTING.md.`);
    process.exit(1);
  }

  console.log(`✓ Schema validation passed for ${eventFiles.length} event files.`);
  console.log(`✓ Slug-history ledger check passed for ${activeSlugs.length} slugs.`);
}

main();
