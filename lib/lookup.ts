import { matchCanonical } from "./canonical";
import {
  findJobByCanonicalName,
  saveGeneratedJob,
  incrementViewCount,
  listAllCanonicalNames,
} from "./job-repository";
import { generateJobContent, GenerationError } from "./generate";
import type { JobContent, JobSource } from "@/types/job-content";

export type LookupResult =
  | { status: "found"; canonicalName: string; source: JobSource; content: JobContent }
  | { status: "ambiguous"; candidates: string[] }
  | { status: "generation_failed"; message: string };

// Job market data (salary, demand, skills) ages out — a cached entry (seed or
// generated) older than this is treated as a cache miss and regenerated on next
// lookup, so results stay fresh without needing a human to manually refresh them.
const STALE_AFTER_DAYS = 90;

function isStale(updatedAt: Date): boolean {
  const ageDays = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  return ageDays > STALE_AFTER_DAYS;
}

export async function lookupJob(rawInput: string): Promise<LookupResult> {
  const knownNames = await listAllCanonicalNames();
  const match = matchCanonical(rawInput, knownNames);

  if (match.status === "ambiguous") {
    return { status: "ambiguous", candidates: match.candidates };
  }

  const existing = await findJobByCanonicalName(match.canonicalName);
  if (existing && !isStale(existing.updatedAt)) {
    await incrementViewCount(match.canonicalName);
    return {
      status: "found",
      canonicalName: existing.canonicalName,
      source: existing.source,
      content: existing.content,
    };
  }

  try {
    const { content, source } = await generateJobContent(match.canonicalName);
    await saveGeneratedJob(match.canonicalName, content, source);
    if (existing) {
      // Refreshing a stale entry, not creating a new one — saveGeneratedJob's
      // upsert already preserves viewCount, so this counts the current visit
      // the same way a fresh-cache hit above would.
      await incrementViewCount(match.canonicalName);
    }
    return { status: "found", canonicalName: match.canonicalName, source, content };
  } catch (error) {
    const message =
      error instanceof GenerationError
        ? error.message
        : "Có lỗi xảy ra khi tạo nội dung, vui lòng thử lại sau";
    return { status: "generation_failed", message };
  }
}
