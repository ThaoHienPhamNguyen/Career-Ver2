import { describe, it, expect } from "vitest";
import { extractFirstJsonValue } from "./extract-json";

describe("extractFirstJsonValue", () => {
  it("returns the text as-is when it is already plain JSON", () => {
    expect(extractFirstJsonValue('{"a":1}')).toBe('{"a":1}');
  });

  it("extracts JSON wrapped in a markdown code fence", () => {
    expect(extractFirstJsonValue('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  it("extracts JSON preceded by prose the model added despite instructions", () => {
    expect(extractFirstJsonValue('Here is the result:\n{"a":1}\nHope that helps!')).toBe('{"a":1}');
  });

  it("does not get confused by braces inside string values", () => {
    const input = '{"note":"use { and } carefully","b":2}';
    expect(extractFirstJsonValue(input)).toBe(input);
  });

  it("does not get confused by an escaped quote right before a brace", () => {
    const input = '{"note":"end with \\"quote\\"","b":2}';
    expect(extractFirstJsonValue(input)).toBe(input);
  });

  it("extracts a top-level array", () => {
    expect(extractFirstJsonValue("prefix [1,2,3] suffix")).toBe("[1,2,3]");
  });

  it("returns null when no JSON-like structure is present", () => {
    expect(extractFirstJsonValue("no json here")).toBeNull();
  });

  it("returns null when the structure never closes", () => {
    expect(extractFirstJsonValue('{"a": 1')).toBeNull();
  });
});
