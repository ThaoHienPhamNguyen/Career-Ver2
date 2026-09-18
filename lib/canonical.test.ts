import { describe, it, expect } from "vitest";
import { matchCanonical } from "./canonical";

const KNOWN_NAMES = ["Data Analyst", "Business Analyst", "Sales Executive"];

describe("matchCanonical", () => {
  it("matches exact canonical name case-insensitively", () => {
    const result = matchCanonical("data analyst", KNOWN_NAMES);
    expect(result).toEqual({ status: "matched", canonicalName: "Data Analyst" });
  });

  it("matches a typo within edit-distance tolerance", () => {
    const result = matchCanonical("Data Analyts", KNOWN_NAMES);
    expect(result).toEqual({ status: "matched", canonicalName: "Data Analyst" });
  });

  it("returns ambiguous for a known ambiguous abbreviation", () => {
    const result = matchCanonical("BA", KNOWN_NAMES);
    expect(result.status).toBe("ambiguous");
  });

  it("treats unrecognized-but-plausible input as a new canonical name", () => {
    const result = matchCanonical("product manager", KNOWN_NAMES);
    expect(result).toEqual({ status: "new", canonicalName: "Product Manager" });
  });

  it("matches typos spread across multiple words in a long canonical name", () => {
    const names = [...KNOWN_NAMES, "Customer Service Executive"];
    const result = matchCanonical("Custmer Servce Exective", names);
    expect(result).toEqual({ status: "matched", canonicalName: "Customer Service Executive" });
  });
});
