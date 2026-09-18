import { describe, it, expect, afterEach } from "vitest";
import { prisma } from "./db";
import {
  findJobByCanonicalName,
  saveGeneratedJob,
  upsertSeedJob,
  incrementViewCount,
  listAllCanonicalNames,
  listUpgradeCandidates,
} from "./job-repository";
import type { JobContent } from "@/types/job-content";

const SAMPLE_CONTENT: JobContent = {
  description: "Test description",
  vnMarket: { value: null, source: null },
  salary: { value: null, source: null },
  demand: { value: null, source: null },
  hiringCompanies: { value: null, source: null },
  similarJobs: [],
  hardSkills: [],
  softSkills: [],
  futureSkills: [],
  careerPath: [],
};

describe("job-repository", () => {
  afterEach(async () => {
    await prisma.jobTitle.deleteMany({
      where: { canonicalName: { in: ["Repo Test Job", "Repo Seed Job"] } },
    });
  });

  it("returns null when a job title does not exist", async () => {
    const result = await findJobByCanonicalName("Repo Test Job");
    expect(result).toBeNull();
  });

  it("saves and retrieves a generated job", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    const result = await findJobByCanonicalName("Repo Test Job");
    expect(result?.source).toBe("generated");
    expect(result?.content.description).toBe("Test description");
  });

  it("upserts a seed job with source seed", async () => {
    await upsertSeedJob("Repo Seed Job", SAMPLE_CONTENT);
    const result = await findJobByCanonicalName("Repo Seed Job");
    expect(result?.source).toBe("seed");
  });

  it("increments the view count", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    const newCount = await incrementViewCount("Repo Test Job");
    expect(newCount).toBe(2); // saveGeneratedJob starts at 1
  });

  it("lists all canonical names including newly saved ones", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    const names = await listAllCanonicalNames();
    expect(names).toContain("Repo Test Job");
  });

  it("lists only generated jobs at or above the view threshold as upgrade candidates", async () => {
    await saveGeneratedJob("Repo Test Job", SAMPLE_CONTENT);
    await incrementViewCount("Repo Test Job");
    await incrementViewCount("Repo Test Job"); // viewCount now 3
    await upsertSeedJob("Repo Seed Job", SAMPLE_CONTENT); // source seed, excluded regardless of views

    const candidates = await listUpgradeCandidates(3);
    const names = candidates.map((c) => c.canonicalName);
    expect(names).toContain("Repo Test Job");
    expect(names).not.toContain("Repo Seed Job");
  });
});
