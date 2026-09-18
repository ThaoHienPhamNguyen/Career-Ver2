import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateJobContent, GenerationError } from "./generate";
import * as tavilyModule from "./tavily";
import * as openaiModule from "./openai";

const VALID_RESPONSE = JSON.stringify({
  description: "Phân tích dữ liệu để hỗ trợ ra quyết định",
  vnMarket: { value: "Nhu cầu tăng mạnh", source: "Nguồn 1" },
  salary: { value: "15-25 triệu", source: "Nguồn 1" },
  demand: { value: "Cạnh tranh trung bình", source: null },
  hiringCompanies: { value: [{ name: "FPT Software", domain: "fpt-software.com" }], source: "Nguồn 1" },
  similarJobs: [
    { name: "Business Analyst", distinction: "Tập trung vào nghiệp vụ hơn kỹ thuật" },
  ],
  hardSkills: [{ name: "SQL", description: "Truy vấn và xử lý dữ liệu" }],
  softSkills: [{ name: "Giao tiếp", description: "Trình bày insight cho stakeholder" }],
  futureSkills: [
    {
      name: "Python",
      label: "critical",
      description: "Ngôn ngữ chính cho xử lý và phân tích dữ liệu quy mô lớn.",
      quote: { text: "Data Scientists who can't code will be obsolete", author: "Erik Brynjolfsson" },
      source: "Nguồn 1",
    },
    {
      name: "AI/ML cơ bản",
      label: "emerging",
      description: "Hiểu nguyên lý cơ bản để ứng dụng mô hình AI/ML vào phân tích.",
      quote: null,
      source: null,
    },
  ],
  careerPath: [
    {
      stageName: "Fresher",
      keySkills: ["Excel", "SQL cơ bản"],
      salaryRange: { value: "10-15 triệu", source: "Nguồn 1" },
      avgTimeToNextStage: "1-2 năm",
    },
  ],
});

const EMPTY_RESPONSE = JSON.stringify({
  description: "Mô tả",
  vnMarket: { value: null, source: null },
  salary: { value: null, source: null },
  demand: { value: null, source: null },
  hiringCompanies: { value: null, source: null },
  similarJobs: [],
  hardSkills: [],
  softSkills: [],
  futureSkills: [],
  careerPath: [],
});

describe("generateJobContent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds JobContent with resolved source URLs when OpenAI cites a valid source", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      {
        title: "Báo cáo lương IT 2026",
        url: "https://example.com/report",
        content: "Data Analyst lương 15-25 triệu",
      },
    ]);
    vi.spyOn(openaiModule, "completeWithOpenAI").mockResolvedValue(VALID_RESPONSE);

    const result = await generateJobContent("Data Analyst");

    expect(result.source).toBe("generated");
    expect(result.content.salary).toEqual({ value: "15-25 triệu", source: "https://example.com/report" });
    expect(result.content.demand).toEqual({ value: null, source: null });
    expect(result.content.careerPath[0].salaryRange.source).toBe("https://example.com/report");
    expect(result.content.hiringCompanies).toEqual({
      value: [{ name: "FPT Software", domain: "fpt-software.com" }],
      source: "https://example.com/report",
    });
    expect(result.content.futureSkills[0]).toEqual({
      name: "Python",
      label: "critical",
      description: "Ngôn ngữ chính cho xử lý và phân tích dữ liệu quy mô lớn.",
      quote: { text: "Data Scientists who can't code will be obsolete", author: "Erik Brynjolfsson" },
      source: "https://example.com/report",
    });
  });

  it("falls back to an unrestricted search when the trusted domains return nothing, tagging the result as generated_extended", async () => {
    const searchSpy = vi
      .spyOn(tavilyModule, "searchTavily")
      .mockResolvedValueOnce([]) // trusted-domain attempt
      .mockResolvedValueOnce([
        { title: "Blog nghề nghiệp", url: "https://random-blog.example/post", content: "..." },
      ]); // unrestricted fallback attempt
    vi.spyOn(openaiModule, "completeWithOpenAI").mockResolvedValue(VALID_RESPONSE);

    const result = await generateJobContent("Nghề hiếm gặp");

    expect(searchSpy).toHaveBeenCalledTimes(2);
    expect(searchSpy.mock.calls[0][1]).toEqual(
      expect.objectContaining({ includeDomains: expect.any(Array) })
    );
    expect(searchSpy.mock.calls[1][1]).toEqual(
      expect.not.objectContaining({ includeDomains: expect.anything() })
    );
    expect(result.source).toBe("generated_extended");
    expect(result.content.salary.source).toBe("https://random-blog.example/post");
  });

  it("throws GenerationError when both the trusted-domain and fallback searches find nothing", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([]);

    await expect(generateJobContent("Nghề không tồn tại xyz")).rejects.toThrow(GenerationError);
  });

  it("throws GenerationError when OpenAI returns invalid JSON even after trying to extract embedded JSON", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      { title: "X", url: "https://example.com", content: "..." },
    ]);
    vi.spyOn(openaiModule, "completeWithOpenAI").mockResolvedValue("không phải JSON");

    await expect(generateJobContent("Data Analyst")).rejects.toThrow(GenerationError);
  });

  it("recovers JSON wrapped in prose/markdown fences from OpenAI", async () => {
    vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      { title: "X", url: "https://example.com", content: "..." },
    ]);
    vi.spyOn(openaiModule, "completeWithOpenAI").mockResolvedValue(
      `Dưới đây là kết quả:\n\`\`\`json\n${EMPTY_RESPONSE}\n\`\`\`\nChúc bạn thành công!`
    );

    const result = await generateJobContent("Data Analyst");
    expect(result.content.description).toBe("Mô tả");
  });

  it("searches trusted domains published within the configured recency window first", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T00:00:00Z"));
    const searchSpy = vi.spyOn(tavilyModule, "searchTavily").mockResolvedValue([
      { title: "X", url: "https://mckinsey.com/report", content: "..." },
    ]);
    vi.spyOn(openaiModule, "completeWithOpenAI").mockResolvedValue(EMPTY_RESPONSE);

    await generateJobContent("Data Analyst");

    expect(searchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        includeDomains: expect.arrayContaining(["mckinsey.com", "vietnamworks.com"]),
        startDate: "2023-09-16",
      })
    );

    vi.useRealTimers();
  });
});
