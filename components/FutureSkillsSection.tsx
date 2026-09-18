import { NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";
import type { FutureSkillItem, FutureSkillLabel } from "@/types/job-content";
import { SectionTitle } from "./SectionTitle";
import { SourceLink } from "./SourcedField";

const LABEL_TEXT: Record<FutureSkillLabel, string> = {
  critical: "Cần ngay",
  important: "Cần sớm",
  emerging: "Đang nổi lên",
  watch: "Nên theo dõi",
};

const LABEL_CLASSES: Record<FutureSkillLabel, string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  important: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  emerging: "bg-brand text-white",
  watch: "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300",
};

const QUADRANT_CLASSES: Record<FutureSkillLabel, string> = {
  critical: "border-red-300 bg-zinc-50 dark:border-red-800 dark:bg-zinc-950",
  important: "border-orange-300 bg-zinc-50 dark:border-orange-800 dark:bg-zinc-950",
  emerging: "border-brand bg-zinc-50 dark:border-brand dark:bg-zinc-950",
  watch: "border-sky-300 bg-zinc-50 dark:border-sky-800 dark:bg-zinc-950",
};

// Quadrant placement derived from the self-assigned label (no new data): critical = high
// impact + high urgency, emerging = high impact only, important = high urgency only,
// watch = neither. Row-major order below lays out top-left/top-right/bottom-left/bottom-right.
const QUADRANT_ORDER: FutureSkillLabel[] = ["emerging", "critical", "watch", "important"];

function SkillCard({ skill }: { skill: FutureSkillItem }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
        {skill.name}
      </span>
      {skill.description && (
        <p className="mt-1 text-[12px] text-zinc-600 dark:text-zinc-400">{skill.description}</p>
      )}
      {skill.quote && (
        <blockquote className="mt-2 border-l-2 border-brand pl-2.5 text-[12px] text-zinc-600 italic dark:text-zinc-400">
          &ldquo;{skill.quote.text}&rdquo;
          <span className="mt-1 block text-[10.5px] text-zinc-400 not-italic dark:text-zinc-500">
            — {skill.quote.author}
          </span>
        </blockquote>
      )}
      <SourceLink source={skill.source} />
    </div>
  );
}

export function FutureSkillsSection({ skills }: { skills: FutureSkillItem[] }) {
  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Kỹ năng cần có trong tương lai</SectionTitle>
      {skills.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <div className="ml-16 grid grid-cols-2 gap-1.5 text-center text-[10px] font-bold tracking-wide text-brand uppercase dark:text-brand">
            <span>Cấp thiết thấp hơn</span>
            <span>Cấp thiết cao hơn</span>
          </div>
          <div className="flex gap-1.5">
            <div className="flex w-14 shrink-0 flex-col justify-between py-2 text-right text-[10px] font-bold tracking-wide text-brand uppercase dark:text-brand">
              <span>Ảnh hưởng cao</span>
              <span>Ảnh hưởng thấp</span>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3">
              {QUADRANT_ORDER.map((label) => {
                const items = skills.filter((skill) => skill.label === label);
                return (
                  <div
                    key={label}
                    className={`flex flex-col gap-2.5 rounded-xl border p-3 ${QUADRANT_CLASSES[label]}`}
                  >
                    <span
                      className={`self-start rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${LABEL_CLASSES[label]}`}
                    >
                      {LABEL_TEXT[label]}
                    </span>
                    {items.length > 0 ? (
                      items.map((skill, index) => <SkillCard key={index} skill={skill} />)
                    ) : (
                      <span className="text-[11px] text-zinc-400 italic dark:text-zinc-500">
                        Chưa có kỹ năng ở mức này
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-zinc-500 italic dark:text-zinc-400">{NO_VERIFIED_DATA_TEXT}</p>
      )}
    </section>
  );
}
