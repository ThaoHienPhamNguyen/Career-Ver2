import type { JobContent } from "@/types/job-content";
import { SalaryTagField, DemandTagField } from "./MarketTagField";
import { HiringCompaniesField } from "./HiringCompaniesField";
import { FutureSkillsSection } from "./FutureSkillsSection";
import { SkillsMatrix } from "./SkillsMatrix";
import { SectionTitle } from "./SectionTitle";
import { CareerPathTimeline } from "./CareerPathTimeline";
import { NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-semibold tracking-wide text-brand uppercase">{children}</p>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-zinc-500 italic dark:text-zinc-400">{children}</p>;
}

function OverviewCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-1.5 text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{text}</p>
    </div>
  );
}

export function JobResultView({
  canonicalName,
  content,
}: {
  canonicalName: string;
  content: JobContent;
}) {
  return (
    <article className="flex w-full flex-col gap-8">
      <header>
        <Eyebrow>Tổng quan nghề nghiệp</Eyebrow>
        <h2 className="text-[22px] font-bold text-zinc-900 dark:text-zinc-100">
          {canonicalName}
        </h2>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <SalaryTagField field={content.salary} />
        <DemandTagField field={content.demand} />
      </div>

      <OverviewCard title="Mô tả nghề" text={content.description || NO_VERIFIED_DATA_TEXT} />

      <HiringCompaniesField field={content.hiringCompanies} />

      <section className="flex flex-col gap-3">
        <SectionTitle>Kỹ năng</SectionTitle>
        <SkillsMatrix hardSkills={content.hardSkills} softSkills={content.softSkills} />
      </section>

      <FutureSkillsSection skills={content.futureSkills} />

      <section className="flex flex-col gap-3">
        <SectionTitle>Lộ trình sự nghiệp</SectionTitle>
        {content.careerPath.length > 0 ? (
          <CareerPathTimeline stages={content.careerPath} />
        ) : (
          <EmptyNote>{NO_VERIFIED_DATA_TEXT}</EmptyNote>
        )}
      </section>
    </article>
  );
}
