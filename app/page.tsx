import { JobSearchForm } from "@/components/JobSearchForm";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
          Tra cứu nghề nghiệp
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Nhập tên một nghề để xem mô tả, thị trường, mức lương, kỹ năng và lộ trình sự nghiệp.
        </p>
      </div>
      <div className="mt-8 flex w-full flex-col items-center">
        <JobSearchForm />
      </div>
    </div>
  );
}
