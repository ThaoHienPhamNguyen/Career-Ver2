import { describe, it, expect } from "vitest";
import { getSourceDisplayName } from "./source-display";

describe("getSourceDisplayName", () => {
  it("maps a known trusted domain to its display name", () => {
    expect(getSourceDisplayName("https://www.careerlink.vn/cam-nang-luong")).toBe("CareerLink");
  });

  it("matches a subdomain of a known trusted domain", () => {
    expect(getSourceDisplayName("https://blog.itviec.com/salary-report")).toBe("ITviec");
  });

  it("falls back to the bare hostname for an unknown domain", () => {
    expect(getSourceDisplayName("https://example.com/report")).toBe("example.com");
  });

  it("falls back to the raw string for a non-URL source label", () => {
    expect(getSourceDisplayName("Nguồn 2")).toBe("Nguồn 2");
  });
});
