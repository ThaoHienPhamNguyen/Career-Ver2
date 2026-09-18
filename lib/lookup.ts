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

export async function lookupJob(rawInput: string): Promise<LookupResult> {
  const knownNames = await listAllCanonicalNames();
  const match = matchCanonical(rawInput, knownNames);

  if (match.status === "ambiguous") {
    return { status: "ambiguous", candidates: match.candidates };
  }

  const existing = await findJobByCanonicalName(match.canonicalName);
  if (existing) {
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
    return { status: "found", canonicalName: match.canonicalName, source, content };
  } catch (error) {
    const message =
      error instanceof GenerationError
        ? error.message
        : "Có lỗi xảy ra khi tạo nội dung, vui lòng thử lại sau";
    return { status: "generation_failed", message };
  }
}
