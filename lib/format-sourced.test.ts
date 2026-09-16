import { describe, it, expect } from "vitest";
import { formatSourcedText, formatSourcedList, NO_VERIFIED_DATA_TEXT } from "./format-sourced";

describe("formatSourcedText", () => {
  it("returns the value when present", () => {
    expect(formatSourcedText({ value: "15-25 triệu", source: "https://example.com" })).toBe(
      "15-25 triệu"
    );
  });

  it("returns the fallback text when value is null", () => {
    expect(formatSourcedText({ value: null, source: null })).toBe(NO_VERIFIED_DATA_TEXT);
  });
});

describe("formatSourcedList", () => {
  it("returns the list when present", () => {
    expect(
      formatSourcedList({ value: ["Python", "SQL"], source: "https://example.com" })
    ).toEqual(["Python", "SQL"]);
  });

  it("returns null when value is null", () => {
    expect(formatSourcedList({ value: null, source: null })).toBeNull();
  });

  it("returns null when value is an empty array", () => {
    expect(formatSourcedList({ value: [], source: "https://x" })).toBeNull();
  });
});
