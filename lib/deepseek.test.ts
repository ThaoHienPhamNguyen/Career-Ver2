import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeWithDeepSeek } from "./deepseek";

describe("completeWithDeepSeek", () => {
  beforeEach(() => {
    process.env.DEEPSEEK_API_KEY = "test-key";
  });

  it("sends system and user prompts and returns the completion text", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "kết quả tổng hợp" } }] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await completeWithDeepSeek("system prompt", "user prompt");

    expect(result).toBe("kết quả tổng hợp");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
  });

  it("throws a descriptive error when DeepSeek responds with a failure status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" })
    );

    await expect(completeWithDeepSeek("s", "u")).rejects.toThrow(
      "DeepSeek completion failed: 429"
    );
  });
});
