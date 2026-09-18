import { Fragment } from "react";
import type { CareerStage } from "@/types/job-content";
import { NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";

function StageCard({ stage, index }: { stage: CareerStage; index: number }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-white">
          {index + 1}
        </span>
        <h4 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
          {stage.stageName}
        </h4>
      </div>
      <ul className="flex flex-col gap-1.5">
        {stage.keySkills.length > 0 ? (
          stage.keySkills.map((skill) => (
            <li
              key={skill}
              className="flex items-start gap-1.5 text-[12.5px] text-zinc-600 dark:text-zinc-400"
            >
              <span
                aria-hidden
                className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-600"
              />
              {skill}
            </li>
          ))
        ) : (
          <li className="text-[12px] text-zinc-400 italic dark:text-zinc-500">
            {NO_VERIFIED_DATA_TEXT}
          </li>
        )}
      </ul>
    </div>
  );
}

function Connector({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 flex-row items-center justify-center gap-2 py-1 sm:flex-col sm:self-center sm:px-2 sm:py-0">
      <span
        aria-hidden
        className="h-5 w-px shrink-0 bg-zinc-300 sm:h-px sm:w-8 dark:bg-zinc-700"
      />
      <span className="shrink-0 whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export function CareerPathTimeline({ stages }: { stages: CareerStage[] }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
      {stages.map((stage, index) => (
        <Fragment key={index}>
          <StageCard stage={stage} index={index} />
          {index < stages.length - 1 && (
            <Connector label={stage.avgTimeToNextStage || "—"} />
          )}
        </Fragment>
      ))}
    </div>
  );
}
