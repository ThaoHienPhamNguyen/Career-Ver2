"use server";

import { lookupJob, type LookupResult } from "@/lib/lookup";

export async function lookupJobAction(rawInput: string): Promise<LookupResult> {
  if (typeof rawInput !== "string") {
    return { status: "generation_failed", message: "Yêu cầu không hợp lệ" };
  }
  const trimmed = rawInput.trim();
  if (!trimmed || trimmed.length > 100) {
    return { status: "generation_failed", message: "Vui lòng nhập tên nghề hợp lệ" };
  }
  return lookupJob(trimmed);
}
