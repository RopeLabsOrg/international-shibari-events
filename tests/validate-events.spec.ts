import { describe, expect, it } from "vitest";
import { findExtraRootValueOffset } from "../scripts/validate-events-lib";

describe("findExtraRootValueOffset", () => {
  it("returns null for a single canonical event object", () => {
    const raw = '{\n  "name": "Event",\n  "slug": "event-slug"\n}\n';
    expect(findExtraRootValueOffset(raw)).toBeNull();
  });

  it("detects a second top-level object concatenated after the first", () => {
    const raw = '{"slug":"one"}\n{"slug":"two"}\n';
    const offset = findExtraRootValueOffset(raw);
    expect(offset).not.toBeNull();
    expect(raw.substring(offset as number).startsWith('{"slug":"two"}')).toBe(true);
  });

  it("detects extra root value even when separated by whitespace and comments", () => {
    const raw = '{"slug":"one"}\n\n// stray note\n{"slug":"two"}\n';
    const offset = findExtraRootValueOffset(raw);
    expect(offset).not.toBeNull();
    expect(raw.substring(offset as number).startsWith('{"slug":"two"}')).toBe(true);
  });

  it("returns null for empty input", () => {
    expect(findExtraRootValueOffset("")).toBeNull();
  });
});
