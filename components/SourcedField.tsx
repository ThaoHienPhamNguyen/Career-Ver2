import { formatSourcedText, formatSourcedList, NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";
import type { SourcedValue } from "@/types/job-content";

function SourceLink({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <a
      href={source}
      target="_blank"
      rel="noopener noreferrer"
      className="ml-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
    >
      Nguồn
    </a>
  );
}

export function SourcedField({ label, field }: { label: string; field: SourcedValue<string> }) {
  return (
    <div>
      <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
        {formatSourcedText(field)}
        <SourceLink source={field.source} />
      </dd>
    </div>
  );
}

export function SourcedListField({
  label,
  field,
}: {
  label: string;
  field: SourcedValue<string[]>;
}) {
  const items = formatSourcedList(field);
  return (
    <div>
      <dt className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
        {items ? (
          <ul className="list-disc pl-5">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          NO_VERIFIED_DATA_TEXT
        )}
        <SourceLink source={field.source} />
      </dd>
    </div>
  );
}
