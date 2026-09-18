import { describe, it, expect } from "vitest";
import { normalize } from "./normalize";

describe("normalize", () => {
  it("resolves a known synonym to its canonical name", () => {
    const result = normalize("Nhân viên kinh doanh");
    expect(result.matchedSynonym).toBe("Sales Executive");
    expect(result.ambiguousCandidates).toBeNull();
  });

  it("flags an ambiguous abbreviation with a candidate list", () => {
    const result = normalize("BA");
    expect(result.ambiguousCandidates).toEqual(["Business Analyst", "Backend Developer"]);
    expect(result.matchedSynonym).toBeNull();
  });

  it("passes through an unrecognized input unchanged for further matching", () => {
    const result = normalize("Product Manager");
    expect(result.normalized).toBe("product manager");
    expect(result.matchedSynonym).toBeNull();
    expect(result.ambiguousCandidates).toBeNull();
  });

  it("resolves a typo of a Vietnamese synonym via fuzzy matching (e.g. missing a letter)", () => {
    const result = normalize("Ke Toa");
    expect(result.matchedSynonym).toBe("Accountant");
    expect(result.ambiguousCandidates).toBeNull();
  });

  it("does not fuzzy-match unrelated short input against a short alias key", () => {
    // "hr" is a real alias key, but a short, unrelated 2-letter input must not
    // fuzzy-match it — only an exact "hr" should resolve to HR Executive.
    const result = normalize("hi");
    expect(result.matchedSynonym).toBeNull();
  });
});
