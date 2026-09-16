import type { JobContent, JobSource } from "@/types/job-content";
import { SourceBadge } from "./SourceBadge";
import { SourcedField, SourcedListField } from "./SourcedField";
import { NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";

export function JobResultView({
  canonicalName,
  source,
  content,
}: {
  canonicalName: string;
  source: JobSource;
  content: JobContent;
}) {
  return (
    <article className="flex w-full flex-col gap-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {canonicalName}
        </h2>
        <SourceBadge source={source} />
      </header>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Mô tả nghề</h3>
        <p className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
          {content.description || NO_VERIFIED_DATA_TEXT}
        </p>
      </section>

      <dl className="grid gap-4 sm:grid-cols-2">
        <SourcedField label="Thị trường VN" field={content.vnMarket} />
        <SourcedField label="Mức lương" field={content.salary} />
        <SourcedField label="Nhu cầu tuyển dụng" field={content.demand} />
        <SourcedListField label="Skill tương lai" field={content.futureSkills} />
      </dl>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Ngành dễ nhầm lẫn
        </h3>
        {content.similarJobs.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {content.similarJobs.map((job, index) => (
              <li key={index}>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{job.name}</span>
                <span className="text-zinc-600 dark:text-zinc-400"> — {job.distinction}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-base text-zinc-900 dark:text-zinc-100">
            {NO_VERIFIED_DATA_TEXT}
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Hard skill</h3>
          {content.hardSkills.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-2">
              {content.hardSkills.map((skill, index) => (
                <li key={index}>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {skill.name}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400"> — {skill.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-zinc-900 dark:text-zinc-100">
              {NO_VERIFIED_DATA_TEXT}
            </p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Soft skill</h3>
          {content.softSkills.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-2">
              {content.softSkills.map((skill, index) => (
                <li key={index}>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {skill.name}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400"> — {skill.description}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-base text-zinc-900 dark:text-zinc-100">
              {NO_VERIFIED_DATA_TEXT}
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Career path</h3>
        {content.careerPath.length > 0 ? (
          <ol className="mt-2 flex flex-col gap-4">
            {content.careerPath.map((stage, index) => (
              <li
                key={index}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {stage.stageName}
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Skill trọng tâm:{" "}
                  {stage.keySkills.length > 0 ? stage.keySkills.join(", ") : NO_VERIFIED_DATA_TEXT}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Thời gian trung bình lên giai đoạn kế:{" "}
                  {stage.avgTimeToNextStage || NO_VERIFIED_DATA_TEXT}
                </p>
                <dl className="mt-2">
                  <SourcedField label="Lương tham khảo" field={stage.salaryRange} />
                </dl>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-base text-zinc-900 dark:text-zinc-100">
            {NO_VERIFIED_DATA_TEXT}
          </p>
        )}
      </section>
    </article>
  );
}
