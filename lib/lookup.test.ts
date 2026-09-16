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

  it("returns cached content and increments view count when job already exists", async () => {
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
    });
    const incrementSpy = vi.spyOn(repoModule, "incrementViewCount").mockResolvedValue(6);
    const generateSpy = vi.spyOn(generateModule, "generateJobContent");

    const result = await lookupJob("data analyst");

    expect(result.status).toBe("found");
    expect(incrementSpy).toHaveBeenCalledWith("Data Analyst");
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
    vi.spyOn(generateModule, "generateJobContent").mockResolvedValue(newContent);
    const saveSpy = vi.spyOn(repoModule, "saveGeneratedJob").mockResolvedValue();

    const result = await lookupJob("product manager");

    expect(result).toEqual({
      status: "found",
      canonicalName: "Product Manager",
      source: "generated",
      content: newContent,
    });
    expect(saveSpy).toHaveBeenCalledWith("Product Manager", newContent);
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
