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

export interface CareerStage {
  stageName: string;
  keySkills: string[];
  salaryRange: SourcedValue<string>;
  avgTimeToNextStage: string;
}

export interface JobContent {
  description: string;
  vnMarket: SourcedValue<string>;
  salary: SourcedValue<string>;
  demand: SourcedValue<string>;
  similarJobs: SimilarJob[];
  hardSkills: SkillItem[];
  softSkills: SkillItem[];
  futureSkills: SourcedValue<string[]>;
  careerPath: CareerStage[];
}

export type JobSource = "seed" | "generated";
