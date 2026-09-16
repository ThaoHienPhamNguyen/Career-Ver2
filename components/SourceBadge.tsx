import type { JobSource } from "@/types/job-content";

export function getSourceBadgeLabel(source: JobSource): string {
  return source === "seed" ? "Đã đối chiếu nguồn" : "AI tổng hợp, đang chờ xác thực";
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
