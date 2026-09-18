import type { LookupResult } from "@/lib/lookup";
import { JobResultView } from "./JobResultView";
import { FeedbackBlock } from "./FeedbackBlock";

export function ResultScreen({
  result,
  onSelectCandidate,
  onBack,
}: {
  result: LookupResult;
  onSelectCandidate: (jobTitle: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
      {result.status === "ambiguous" && (
        <div className="flex flex-col gap-3">
          <p className="text-zinc-900 dark:text-zinc-100">Bạn muốn tra cứu nghề nào?</p>
          <div className="flex flex-wrap gap-2">
            {result.candidates.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => onSelectCandidate(candidate)}
                className="rounded-full border border-brand-tint-strong bg-brand-tint px-4 py-2 text-sm font-medium text-brand-dark transition hover:bg-brand-tint-strong dark:text-brand"
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>
      )}

      {result.status === "generation_failed" && (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {result.message}
        </p>
      )}

      {result.status === "found" && (
        <>
          <JobResultView canonicalName={result.canonicalName} content={result.content} />

          <FeedbackBlock />
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="self-start rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:text-zinc-300"
        >
          ← Tra cứu nghề khác
        </button>

        {result.status === "found" && (
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
            📄 Matching CV — sắp ra mắt
          </span>
        )}
      </div>
    </div>
  );
}
