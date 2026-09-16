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

  it("sends include_domains and a filtered start_date when options are given", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await searchTavily("lương Data Analyst Việt Nam", {
      includeDomains: ["mckinsey.com", "vietnamworks.com"],
      startDate: "2023-09-16",
    });

    const [, requestInit] = mockFetch.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.include_domains).toEqual(["mckinsey.com", "vietnamworks.com"]);
    expect(body.include_domains_mode).toBe("filter");
    expect(body.start_date).toBe("2023-09-16");
    expect(body.filter_by_published_date).toBe(true);
  });

  it("omits domain/date filter fields when no options are given", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await searchTavily("test query");

    const [, requestInit] = mockFetch.mock.calls[0];
    const body = JSON.parse(requestInit.body as string);
    expect(body.include_domains).toBeUndefined();
    expect(body.start_date).toBeUndefined();
    expect(body.filter_by_published_date).toBeUndefined();
  });
});
