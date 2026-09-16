"use server";

import { lookupJob, type LookupResult } from "@/lib/lookup";

export async function lookupJobAction(rawInput: string): Promise<LookupResult> {
  return lookupJob(rawInput);
}
