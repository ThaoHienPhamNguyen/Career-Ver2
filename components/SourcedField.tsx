import { formatSourcedText } from "@/lib/format-sourced";
import { getSourceDisplayName } from "@/lib/source-display";
import type { SourcedValue } from "@/types/job-content";

export function SourceLink({ source }: { source: string | null }) {
  if (!source) return null;
  if (!/^https?:\/\//.test(source)) {
    return <span className="mt-1.5 block font-mono text-[10px] text-zinc-400">{source}</span>;
  }
  return (
    <span className="mt-1.5 block font-mono text-[10px] text-zinc-400">
      Nguồn: {getSourceDisplayName(source)}
    </span>
  );
}

export function SourcedField({
  icon,
  label,
  field,
}: {
  icon?: string;
  label: string;
  field: SourcedValue<string>;
}) {
  return (
    <div className="rounded-xl border border-l-4 border-zinc-200 border-l-brand bg-white p-3.5 dark:border-zinc-800 dark:border-l-brand dark:bg-zinc-900">
      <dt className="text-[10px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        {icon && <span aria-hidden>{icon} </span>}
        {label}
      </dt>
      <dd className="mt-1.5 text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
        {formatSourcedText(field)}
        <SourceLink source={field.value ? field.source : null} />
      </dd>
    </div>
  );
}
