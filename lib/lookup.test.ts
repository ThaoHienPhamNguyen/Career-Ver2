import { describe, it, expect, vi, beforeEach } from "vitest";
import { lookupJob } from "./lookup";
import * as canonicalModule from "./canonical";
import * as repoModule from "./job-repository";
import * as generateModule from "./generate";
import type { JobContent } from "@/types/job-content";

describe("lookupJob", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ambiguous candidates without touching generation", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "ambiguous",
      candidates: ["Business Analyst", "Backend Developer"],
    });
    const generateSpy = vi.spyOn(generateModule, "generateJobContent");

    const result = await lookupJob("BA");

    expect(result).toEqual({
      status: "ambiguous",
      candidates: ["Business Analyst", "Backend Developer"],
    });
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("returns cached content and increments view count when job already exists and is not stale", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue(["Data Analyst"]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "matched",
      canonicalName: "Data Analyst",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue({
      canonicalName: "Data Analyst",
      source: "seed",
      content: { description: "..." } as unknown as JobContent,
      viewCount: 5,
      updatedAt: new Date(), // just updated — well within the freshness window
    });
    const incrementSpy = vi.spyOn(repoModule, "incrementViewCount").mockResolvedValue(6);
    const generateSpy = vi.spyOn(generateModule, "generateJobContent");

    const result = await lookupJob("data analyst");

    expect(result.status).toBe("found");
    expect(incrementSpy).toHaveBeenCalledWith("Data Analyst");
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("regenerates and overwrites content when the cached entry is older than the staleness threshold", async () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 91); // 1 day past the 90-day threshold

    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue(["Data Analyst"]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "matched",
      canonicalName: "Data Analyst",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue({
      canonicalName: "Data Analyst",
      source: "generated",
      content: { description: "old content" } as unknown as JobContent,
      viewCount: 5,
      updatedAt: staleDate,
    });
    const freshContent = { description: "fresh content" } as unknown as JobContent;
    const generateSpy = vi
      .spyOn(generateModule, "generateJobContent")
      .mockResolvedValue({ content: freshContent, source: "generated" });
    const saveSpy = vi.spyOn(repoModule, "saveGeneratedJob").mockResolvedValue();
    const incrementSpy = vi.spyOn(repoModule, "incrementViewCount").mockResolvedValue(6);

    const result = await lookupJob("data analyst");

    expect(generateSpy).toHaveBeenCalledWith("Data Analyst");
    expect(saveSpy).toHaveBeenCalledWith("Data Analyst", freshContent, "generated");
    expect(incrementSpy).toHaveBeenCalledWith("Data Analyst");
    expect(result).toEqual({
      status: "found",
      canonicalName: "Data Analyst",
      source: "generated",
      content: freshContent,
    });
  });

  it("treats a cached entry just under the staleness threshold as still fresh", async () => {
    const borderlineDate = new Date();
    borderlineDate.setDate(borderlineDate.getDate() - 89); // under the 90-day threshold

    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue(["Data Analyst"]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "matched",
      canonicalName: "Data Analyst",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue({
      canonicalName: "Data Analyst",
      source: "seed",
      content: { description: "..." } as unknown as JobContent,
      viewCount: 5,
      updatedAt: borderlineDate,
    });
    vi.spyOn(repoModule, "incrementViewCount").mockResolvedValue(6);
    const generateSpy = vi.spyOn(generateModule, "generateJobContent");

    const result = await lookupJob("data analyst");

    expect(result.status).toBe("found");
    expect(generateSpy).not.toHaveBeenCalled();
  });

  it("generates and saves new content when job title is new", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "new",
      canonicalName: "Product Manager",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue(null);
    const newContent = { description: "Quản lý sản phẩm" } as unknown as JobContent;
    vi.spyOn(generateModule, "generateJobContent").mockResolvedValue({
      content: newContent,
      source: "generated",
    });
    const saveSpy = vi.spyOn(repoModule, "saveGeneratedJob").mockResolvedValue();

    const result = await lookupJob("product manager");

    expect(result).toEqual({
      status: "found",
      canonicalName: "Product Manager",
      source: "generated",
      content: newContent,
    });
    expect(saveSpy).toHaveBeenCalledWith("Product Manager", newContent, "generated");
  });

  it("passes through the generated_extended tier when trusted domains had no results", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "new",
      canonicalName: "Nghề Hiếm Gặp",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue(null);
    const newContent = { description: "..." } as unknown as JobContent;
    vi.spyOn(generateModule, "generateJobContent").mockResolvedValue({
      content: newContent,
      source: "generated_extended",
    });
    const saveSpy = vi.spyOn(repoModule, "saveGeneratedJob").mockResolvedValue();

    const result = await lookupJob("nghề hiếm gặp");

    expect(result).toEqual({
      status: "found",
      canonicalName: "Nghề Hiếm Gặp",
      source: "generated_extended",
      content: newContent,
    });
    expect(saveSpy).toHaveBeenCalledWith("Nghề Hiếm Gặp", newContent, "generated_extended");
  });

  it("returns generation_failed with the error message when generation throws", async () => {
    vi.spyOn(repoModule, "listAllCanonicalNames").mockResolvedValue([]);
    vi.spyOn(canonicalModule, "matchCanonical").mockReturnValue({
      status: "new",
      canonicalName: "Nghề Không Tồn Tại Xyz",
    });
    vi.spyOn(repoModule, "findJobByCanonicalName").mockResolvedValue(null);
    vi.spyOn(generateModule, "generateJobContent").mockRejectedValue(
      new generateModule.GenerationError('Không tìm thấy nguồn nào cho "Nghề Không Tồn Tại Xyz"')
    );

    const result = await lookupJob("nghề không tồn tại xyz");

    expect(result).toEqual({
      status: "generation_failed",
      message: 'Không tìm thấy nguồn nào cho "Nghề Không Tồn Tại Xyz"',
    });
  });
});
