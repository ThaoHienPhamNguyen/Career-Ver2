export interface SourcedValue<T> {
  value: T | null;
  source: string | null;
}

export interface SimilarJob {
  name: string;
  distinction: string;
}

export interface SkillItem {
  name: string;
  description: string;
}

export interface HiringCompany {
  name: string;
  /** Domain used to fetch a logo, e.g. "fpt.com.vn" → https://logo.clearbit.com/fpt.com.vn */
  domain: string;
}

export type FutureSkillLabel = "critical" | "important" | "emerging" | "watch";

export interface FutureSkillItem {
  name: string;
  label: FutureSkillLabel;
  description: string;
  quote: { text: string; author: string } | null;
  source: string | null;
}

export interface CareerStage {
  stageName: string;
  keySkills: string[];
  /** Kept for future use; not currently rendered (career path timeline focuses on skills). */
  salaryRange: SourcedValue<string>;
  avgTimeToNextStage: string;
}

export interface JobContent {
  description: string;
  /** Kept for future use; not currently rendered (superseded by hiringCompanies). */
  vnMarket: SourcedValue<string>;
  salary: SourcedValue<string>;
  demand: SourcedValue<string>;
  /** Companies known to have this role in their org structure — not necessarily hiring right now. */
  hiringCompanies: SourcedValue<HiringCompany[]>;
  /** Kept for future use; not currently rendered. */
  similarJobs: SimilarJob[];
  hardSkills: SkillItem[];
  softSkills: SkillItem[];
  futureSkills: FutureSkillItem[];
  careerPath: CareerStage[];
}

/**
 * "generated": trusted-domain search (data/trusted-sources.json) found results.
 * "generated_extended": trusted domains had nothing, so generation fell back to an
 * unrestricted web search — still real, cited sources, just not from the curated list.
 */
export type JobSource = "seed" | "generated" | "generated_extended";
