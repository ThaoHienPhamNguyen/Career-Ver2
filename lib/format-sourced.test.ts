import { describe, it, expect } from "vitest";
import { formatSourcedText, NO_VERIFIED_DATA_TEXT } from "./format-sourced";

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
