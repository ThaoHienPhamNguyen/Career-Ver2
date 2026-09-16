import type { JobSource } from "@/types/job-content";

export function getSourceBadgeLabel(source: JobSource): string {
  switch (source) {
    case "seed":
      return "Đã đối chiếu nguồn";
    case "generated":
      return "AI tổng hợp, đang chờ xác thực";
    default: {
      const _exhaustive: never = source;
      return _exhaustive;
    }
  }
}

export function SourceBadge({ source }: { source: JobSource }) {
  const isSeed = source === "seed";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        isSeed
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
          : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
      }`}
    >
      {getSourceBadgeLabel(source)}
    </span>
  );
}
