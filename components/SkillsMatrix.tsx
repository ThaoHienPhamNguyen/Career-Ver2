import { Fragment } from "react";
import { NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";
import type { SkillItem } from "@/types/job-content";

function SkillCell({ skill, tone }: { skill: SkillItem | undefined; tone: string }) {
  if (!skill) {
    return (
      <div className={`${tone} p-3.5 text-[12px] text-zinc-300 dark:text-zinc-600`}>—</div>
    );
  }
  return (
    <div className={`${tone} p-3.5`}>
      <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{skill.name}</p>
      <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{skill.description}</p>
    </div>
  );
}

export function SkillsMatrix({
  hardSkills,
  softSkills,
}: {
  hardSkills: SkillItem[];
  softSkills: SkillItem[];
}) {
  if (hardSkills.length === 0 && softSkills.length === 0) {
    return (
      <p className="text-[13px] text-zinc-500 italic dark:text-zinc-400">{NO_VERIFIED_DATA_TEXT}</p>
    );
  }

  const rowCount = Math.max(hardSkills.length, softSkills.length);
  const rows = Array.from({ length: rowCount }, (_, index) => index);

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 shadow-sm dark:border-zinc-800 dark:bg-zinc-800">
      <div className="bg-zinc-50 p-3 dark:bg-zinc-950">
        <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Hard skill
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">Chuyên môn cần ngay</p>
      </div>
      <div className="bg-zinc-50 p-3 dark:bg-zinc-950">
        <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
          Soft skill
        </p>
        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
          Hỗ trợ làm việc lâu dài
        </p>
      </div>
      {rows.map((index) => {
        const tone =
          index % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 dark:bg-zinc-950/60";
        return (
          <Fragment key={index}>
            <SkillCell skill={hardSkills[index]} tone={tone} />
            <SkillCell skill={softSkills[index]} tone={tone} />
          </Fragment>
        );
      })}
    </div>
  );
}
