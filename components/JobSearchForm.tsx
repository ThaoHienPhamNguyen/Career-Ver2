"use client";

import { useState, type FormEvent } from "react";
import { lookupJobAction } from "@/app/actions";
import type { LookupResult } from "@/lib/lookup";
import { JobResultView } from "./JobResultView";

type Status = "idle" | "loading";

export function JobSearchForm() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);

  async function runSearch(jobTitle: string) {
    setStatus("loading");
    setResult(null);
    try {
      setResult(await lookupJobAction(jobTitle));
    } catch {
      setResult({
        status: "generation_failed",
        message: "Có lỗi xảy ra khi tra cứu, vui lòng thử lại sau",
      });
    } finally {
      setStatus("idle");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) return;
    void runSearch(input.trim());
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập tên nghề, ví dụ: Data Analyst"
          aria-label="Tên nghề"
          className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {status === "loading" ? "Đang tra cứu..." : "Tra cứu"}
        </button>
      </form>

      <div aria-live="polite">
        {result?.status === "ambiguous" && (
          <div className="flex flex-col gap-2">
            <p className="text-zinc-900 dark:text-zinc-100">Bạn muốn tra cứu nghề nào?</p>
            <div className="flex flex-wrap gap-2">
              {result.candidates.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  disabled={status === "loading"}
                  onClick={() => {
                    setInput(candidate);
                    void runSearch(candidate);
                  }}
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
                >
                  {candidate}
                </button>
              ))}
            </div>
          </div>
        )}

        {result?.status === "generation_failed" && (
          <p role="alert" className="text-red-600 dark:text-red-400">
            {result.message}
          </p>
        )}

        {result?.status === "found" && (
          <JobResultView
            canonicalName={result.canonicalName}
            source={result.source}
            content={result.content}
          />
        )}
      </div>
    </div>
  );
}
