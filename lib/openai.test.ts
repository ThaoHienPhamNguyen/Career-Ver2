import { describe, it, expect, vi, beforeEach } from "vitest";
import { completeWithOpenAI } from "./openai";

describe("completeWithOpenAI", () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("sends system and user prompts and returns the completion text", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "kết quả tổng hợp" } }] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await completeWithOpenAI("system prompt", "user prompt");

    expect(result).toBe("kết quả tổng hợp");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" }),
      })
    );
  });

  it("requests a JSON-mode response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    await completeWithOpenAI("s", "u");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("throws a descriptive error when OpenAI responds with a failure status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 429, statusText: "Too Many Requests" })
    );

    await expect(completeWithOpenAI("s", "u")).rejects.toThrow(
      "OpenAI completion failed: 429"
    );
  });
});
