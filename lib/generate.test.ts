import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateJobContent, GenerationError } from "./generate";
import * as tavilyModule from "./tavily";
import * as deepseekModule from "./deepseek";

describe("generateJobContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds JobContent with resolved source URLs when DeepSeek cites a valid source", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      {
        title: "Báo cáo lương IT 2026",
        url: "https://example.com/report",
        content: "Data Analyst lương 15-25 triệu",
      },
    ]);
    vi.spyOn(deepseekModule, "completeWithDeepSeek").mockResolvedValue(
      JSON.stringify({
        description: "Phân tích dữ liệu để hỗ trợ ra quyết định",
        vnMarket: { value: "Nhu cầu tăng mạnh", source: "Nguồn 1" },
        salary: { value: "15-25 triệu", source: "Nguồn 1" },
        demand: { value: "Cạnh tranh trung bình", source: null },
        similarJobs: [
          { name: "Business Analyst", distinction: "Tập trung vào nghiệp vụ hơn kỹ thuật" },
        ],
        hardSkills: [{ name: "SQL", description: "Truy vấn và xử lý dữ liệu" }],
        softSkills: [{ name: "Giao tiếp", description: "Trình bày insight cho stakeholder" }],
        futureSkills: { value: ["Python", "AI/ML cơ bản"], source: null },
        careerPath: [
          {
            stageName: "Fresher",
            keySkills: ["Excel", "SQL cơ bản"],
            salaryRange: { value: "10-15 triệu", source: "Nguồn 1" },
            avgTimeToNextStage: "1-2 năm",
          },
        ],
      })
    );

    const result = await generateJobContent("Data Analyst");

    expect(result.salary).toEqual({ value: "15-25 triệu", source: "https://example.com/report" });
    expect(result.demand).toEqual({ value: null, source: null });
    expect(result.careerPath[0].salaryRange.source).toBe("https://example.com/report");
  });

  it("throws GenerationError when no search results are found", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([]);

    await expect(generateJobContent("Nghề không tồn tại xyz")).rejects.toThrow(GenerationError);
  });

  it("throws GenerationError when DeepSeek returns invalid JSON", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      { title: "X", url: "https://example.com", content: "..." },
    ]);
    vi.spyOn(deepseekModule, "completeWithDeepSeek").mockResolvedValue("không phải JSON");

    await expect(generateJobContent("Data Analyst")).rejects.toThrow(GenerationError);
  });
});
