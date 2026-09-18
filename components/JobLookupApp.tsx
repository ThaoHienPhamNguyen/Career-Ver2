"use client";

import { useState } from "react";
import { lookupJobAction } from "@/app/actions";
import type { LookupResult } from "@/lib/lookup";
import { JobSearchForm } from "./JobSearchForm";
import { LoadingScreen } from "./LoadingScreen";
import { ResultScreen } from "./ResultScreen";
import { ReasonCard } from "./ReasonCard";

type Screen = "idle" | "loading" | "result";

export function JobLookupApp() {
  const [screen, setScreen] = useState<Screen>("idle");
  const [result, setResult] = useState<LookupResult | null>(null);

  async function runSearch(jobTitle: string) {
    setScreen("loading");
    try {
      setResult(await lookupJobAction(jobTitle));
    } catch {
      setResult({
        status: "generation_failed",
        message: "Có lỗi xảy ra khi tra cứu, vui lòng thử lại sau",
      });
    } finally {
      setScreen("result");
    }
  }

  function handleBack() {
    setScreen("idle");
    setResult(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 px-4 py-3">
          <button type="button" onClick={handleBack} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
              🧭
            </span>
            <span className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Career Hub
            </span>
          </button>
        </div>
      </header>

      {screen === "idle" && (
        <>
          <section className="relative overflow-hidden bg-gradient-to-br from-brand-tint via-pink-100 to-fuchsia-100 dark:from-zinc-950 dark:via-brand-tint dark:to-zinc-950">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gradient-to-br from-brand to-fuchsia-400 opacity-30 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-fuchsia-300 to-brand opacity-20 blur-3xl"
            />
            <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pt-10 pb-12 sm:pt-14">
              <div className="flex flex-col gap-2.5">
                <p className="font-heading text-sm font-semibold uppercase tracking-wide text-brand">
                  Người bạn đồng hành sự nghiệp
                </p>
                <h1 className="font-heading text-3xl font-extrabold text-zinc-900 sm:text-4xl dark:text-zinc-100">
                  Career Hub — hiểu nghề, chọn đúng hướng
                </h1>
                <p className="max-w-xl text-[15px] text-zinc-700 dark:text-zinc-300">
                  Nhập tên một nghề để xem mô tả, thị trường, mức lương, kỹ năng và lộ trình sự
                  nghiệp — thông tin được AI tổng hợp từ các nguồn uy tín như báo cáo ngành, trang
                  tuyển dụng và khảo sát lương.
                </p>
              </div>
              <div className="w-full rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg shadow-brand/10 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <JobSearchForm onSubmit={runSearch} />
              </div>
            </div>
          </section>

          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 py-14">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="font-heading text-sm font-semibold uppercase tracking-wide text-brand">
                Vì sao chọn Career Hub
              </p>
              <h2 className="font-heading text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                4 điều Career Hub mang lại cho bạn
              </h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <ReasonCard
                index={1}
                icon="🔍"
                title="Tìm hiểu về nghề"
                description="Tra cứu mô tả, thị trường VN, mức lương, kỹ năng và lộ trình sự nghiệp cho từng nghề — mọi số liệu đều có nguồn trích dẫn."
              />
              <ReasonCard
                index={2}
                icon="🔄"
                title="So sánh chuyển nghề"
                description="So sánh lộ trình, kỹ năng cần bổ sung và chênh lệch lương khi cân nhắc chuyển từ nghề này sang nghề khác."
                comingSoon
              />
              <ReasonCard
                index={3}
                icon="📄"
                title="Matching CV"
                description="Tải CV lên và đối chiếu với mô tả công việc để biết bạn phù hợp đến đâu, còn thiếu kỹ năng gì."
                comingSoon
              />
              <ReasonCard
                index={4}
                icon="🎯"
                title="Cá nhân hoá gợi ý"
                description="Gợi ý lộ trình, khoá học và hướng đi phù hợp dựa trên hồ sơ và mục tiêu riêng của bạn."
                comingSoon
              />
            </div>
          </div>
        </>
      )}

      {screen === "loading" && <LoadingScreen />}

      {screen === "result" && result && (
        <ResultScreen result={result} onSelectCandidate={runSearch} onBack={handleBack} />
      )}
    </div>
  );
}
