import Image from "next/image";
import { NO_VERIFIED_DATA_TEXT } from "@/lib/format-sourced";
import type { SourcedValue, HiringCompany } from "@/types/job-content";
import { SectionTitle } from "./SectionTitle";

export function HiringCompaniesField({ field }: { field: SourcedValue<HiringCompany[]> }) {
  const companies = field.value && field.value.length > 0 ? field.value : null;

  return (
    <section className="flex flex-col gap-3">
      <SectionTitle>Công ty có vị trí này trong tổ chức</SectionTitle>
      {companies ? (
        <div className="flex flex-wrap gap-3">
          {companies.map((company) => (
            <div
              key={company.domain}
              className="flex items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Image
                src={`https://www.google.com/s2/favicons?domain=${company.domain}&sz=64`}
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-md object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                {company.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-zinc-500 italic dark:text-zinc-400">
          {NO_VERIFIED_DATA_TEXT}
        </p>
      )}
    </section>
  );
}
