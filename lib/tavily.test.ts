import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchTavily } from "./tavily";

describe("searchTavily", () => {
  beforeEach(() => {
    process.env.TAVILY_API_KEY = "test-key";
  });

  it("sends the query to Tavily and returns parsed results", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            title: "Báo cáo lương 2026",
            url: "https://example.com/report",
            content: "Nội dung tóm tắt...",
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const results = await searchTavily("lương Data Analyst Việt Nam 2026");

    expect(results).toEqual([
      { title: "Báo cáo lương 2026", url: "https://example.com/report", content: "Nội dung tóm tắt..." },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.tavily.com/search",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws a descriptive error when Tavily responds with a failure status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "Server Error" })
    );

    await expect(searchTavily("test query")).rejects.toThrow("Tavily search failed: 500");
  });
});
