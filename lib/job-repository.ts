import { prisma } from "./db";
import type { JobContent, JobSource } from "@/types/job-content";

export interface JobRecord {
  canonicalName: string;
  source: JobSource;
  content: JobContent;
  viewCount: number;
}

function toJobRecord(row: {
  canonicalName: string;
  source: string;
  content: unknown;
  viewCount: number;
}): JobRecord {
  return {
    canonicalName: row.canonicalName,
    source: row.source as JobSource,
    content: row.content as JobContent,
    viewCount: row.viewCount,
  };
}

export async function findJobByCanonicalName(canonicalName: string): Promise<JobRecord | null> {
  const row = await prisma.jobTitle.findUnique({ where: { canonicalName } });
  return row ? toJobRecord(row) : null;
}

export async function saveGeneratedJob(canonicalName: string, content: JobContent): Promise<void> {
  await prisma.jobTitle.upsert({
    where: { canonicalName },
    create: { canonicalName, source: "generated", content: content as object, viewCount: 1 },
    update: { content: content as object },
  });
}

export async function upsertSeedJob(canonicalName: string, content: JobContent): Promise<void> {
  await prisma.jobTitle.upsert({
    where: { canonicalName },
    create: { canonicalName, source: "seed", content: content as object, viewCount: 0 },
    update: { source: "seed", content: content as object },
  });
}

export async function incrementViewCount(canonicalName: string): Promise<number> {
  const updated = await prisma.jobTitle.update({
    where: { canonicalName },
    data: { viewCount: { increment: 1 } },
  });
  return updated.viewCount;
}

export async function listAllCanonicalNames(): Promise<string[]> {
  const rows = await prisma.jobTitle.findMany({ select: { canonicalName: true } });
  return rows.map((r) => r.canonicalName);
}

export async function listUpgradeCandidates(minViews: number): Promise<JobRecord[]> {
  const rows = await prisma.jobTitle.findMany({
    where: { source: "generated", viewCount: { gte: minViews } },
  });
  return rows.map(toJobRecord);
}
