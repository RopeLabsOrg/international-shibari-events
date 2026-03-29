#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { parse as parseJsonc } from "jsonc-parser";
import { EVENT_SCHEMA, type IEventData } from "../schemas/event.schema";

const DATA_DIRECTORY = path.resolve(process.cwd(), "data/events");
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateEventData = ajv.compile<IEventData>(EVENT_SCHEMA);

function validateFile(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = parseJsonc(raw) as unknown;

  if (validateEventData(parsed)) {
    return [];
  }

  return (validateEventData.errors || []).map((error) => {
    const pointer = error.instancePath || "/";
    return `${filePath}: ${pointer} ${error.message || "invalid"}`;
  });
}

function main(): void {
  if (!fs.existsSync(DATA_DIRECTORY)) {
    console.log("No data/events directory found. Skipping validation.");
    return;
  }

  const eventFiles = fs
    .readdirSync(DATA_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonc"))
    .map((entry) => path.join(DATA_DIRECTORY, entry.name));

  const errors: string[] = [];
  for (const filePath of eventFiles) {
    errors.push(...validateFile(filePath));
  }

  if (errors.length > 0) {
    console.error("Event data schema validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Schema validation passed for ${eventFiles.length} event files.`);
}

main();
