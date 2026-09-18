import type { JobSource } from "@/types/job-content";

export function getSourceBadgeLabel(source: JobSource): string {
  switch (source) {
    case "seed":
      return "Đã đối chiếu nguồn";
    case "generated":
      return "AI tổng hợp, đang chờ xác thực";
    case "generated_extended":
      return "AI tổng hợp, nguồn mở rộng";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

const BADGE_STYLES: Record<JobSource, string> = {
  seed: "bg-success-bg text-success-text",
  generated: "bg-warning-bg text-warning-text",
  generated_extended: "bg-brand-tint text-brand-dark dark:bg-zinc-800 dark:text-brand",
};

const BADGE_ICONS: Record<JobSource, string> = {
  seed: "✓",
  generated: "✨",
  generated_extended: "🌐",
};

export function SourceBadge({ source }: { source: JobSource }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-wide ${BADGE_STYLES[source]}`}
    >
      <span aria-hidden>{BADGE_ICONS[source]}</span>
      <span>{getSourceBadgeLabel(source)}</span>
    </span>
  );
}
