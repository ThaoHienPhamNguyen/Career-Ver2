import type { SourcedValue } from "@/types/job-content";

export const NO_VERIFIED_DATA_TEXT = "Chưa có dữ liệu xác thực";

export function formatSourcedText(field: SourcedValue<string>): string {
  return field.value ?? NO_VERIFIED_DATA_TEXT;
}

export function formatSourcedList(field: SourcedValue<string[]>): string[] | null {
  return field.value;
}
