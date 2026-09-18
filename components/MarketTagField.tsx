import { extractSalaryHeadline, extractDemandHeadline, type DemandTone } from "@/lib/market-tags";
import { formatSourcedText, NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";
import type { SourcedValue } from "@/types/job-content";
import { SourceLink } from "./SourcedField";

const CARD_CLASSES =
  "rounded-xl border border-l-4 border-zinc-200 border-l-brand bg-white p-3.5 dark:border-zinc-800 dark:border-l-brand dark:bg-zinc-900";
const LABEL_CLASSES =
  "text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400";
const DETAIL_CLASSES = "mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400";

export function SalaryTagField({ field }: { field: SourcedValue<string> }) {
  const headline = field.value ? extractSalaryHeadline(field.value) : null;

  return (
    <div className={CARD_CLASSES}>
      <dt className={LABEL_CLASSES}>
        <span aria-hidden>💰 </span>Mức lương
      </dt>
      <dd className="mt-1.5">
        {field.value ? (
          <span className="inline-flex items-center rounded-full bg-brand-tint px-3 py-1 text-[15px] font-bold text-brand-dark dark:bg-zinc-800 dark:text-brand">
            {headline ?? field.value}
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-zinc-500">{NO_VERIFIED_DATA_TEXT}</span>
        )}
        {field.value && headline && field.value !== headline && (
          <p className={DETAIL_CLASSES}>{field.value}</p>
        )}
        <SourceLink source={field.value ? field.source : null} />
      </dd>
    </div>
  );
}

const TONE_STYLES: Record<DemandTone, string> = {
  hot: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  cool: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  neutral: "bg-brand-tint text-brand-dark dark:bg-zinc-800 dark:text-brand",
};

const TONE_ICON: Record<DemandTone, string> = {
  hot: "🔥",
  cool: "📉",
  neutral: "📊",
};

export function DemandTagField({ field }: { field: SourcedValue<string> }) {
  const headline = field.value ? extractDemandHeadline(field.value) : null;

  return (
    <div className={CARD_CLASSES}>
      <dt className={LABEL_CLASSES}>
        <span aria-hidden>📈 </span>Nhu cầu tuyển dụng
      </dt>
      <dd className="mt-1.5">
        {field.value && headline ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[15px] font-bold ${TONE_STYLES[headline.tone]}`}
          >
            <span aria-hidden>{TONE_ICON[headline.tone]}</span>
            {headline.text}
          </span>
        ) : (
          <span className="text-[15px] font-semibold text-zinc-500">{formatSourcedText(field)}</span>
        )}
        {field.value && field.value !== headline?.text && <p className={DETAIL_CLASSES}>{field.value}</p>}
        <SourceLink source={field.value ? field.source : null} />
      </dd>
    </div>
  );
}
