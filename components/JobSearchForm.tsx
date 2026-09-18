"use client";

import { useState, type FormEvent } from "react";

const SUGGESTED_JOBS = [
  "Data Analyst",
  "Backend Developer",
  "Business Analyst",
  "Marketing Executive",
  "UI/UX Designer",
  "Project Manager",
];

export function JobSearchForm({ onSubmit }: { onSubmit: (jobTitle: string) => void }) {
  const [input, setInput] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  function handleSuggestionClick(jobTitle: string) {
    setInput(jobTitle);
    onSubmit(jobTitle);
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Nhập tên nghề, ví dụ: Data Analyst"
          aria-label="Tên nghề"
          className="flex-1 rounded-full border border-zinc-300 bg-zinc-50 px-5 py-2.5 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-full bg-brand px-5 py-2.5 font-heading font-semibold text-white shadow-sm shadow-brand/30 transition hover:bg-brand-dark disabled:opacity-50"
        >
          Tra cứu
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-heading text-[13px] font-bold text-brand dark:text-brand">
          ✨ Gợi ý cho bạn:
        </span>
        {SUGGESTED_JOBS.map((jobTitle) => (
          <button
            key={jobTitle}
            type="button"
            onClick={() => handleSuggestionClick(jobTitle)}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-600 transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {jobTitle}
          </button>
        ))}
      </div>
    </div>
  );
}
