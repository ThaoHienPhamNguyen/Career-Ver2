"use client";

import { useState } from "react";

type Feedback = "up" | "down" | null;

export function FeedbackBlock() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [submitted, setSubmitted] = useState(false);
  const [comment, setComment] = useState("");

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-5 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
          Cảm ơn bạn đã phản hồi!
        </p>
        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
          Ý kiến của bạn giúp Career Hub cải thiện thông tin tốt hơn.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
        Bạn thấy thông tin này thế nào?
      </p>

      {feedback !== "down" && (
        <div className="flex flex-row gap-2">
          <button
            type="button"
            onClick={() => {
              setFeedback("up");
              setSubmitted(true);
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2.5 text-[13.5px] font-medium text-zinc-600 transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:text-zinc-300"
          >
            👍 Thông tin hữu ích
          </button>
          <button
            type="button"
            onClick={() => setFeedback("down")}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-2.5 text-[13.5px] font-medium text-zinc-600 transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:text-zinc-300"
          >
            👎 Có gì đó chưa ổn <span aria-hidden>→</span>
          </button>
        </div>
      )}

      {feedback === "down" && (
        <div className="flex flex-col gap-2.5">
          <label
            htmlFor="feedback-comment"
            className="text-[12px] text-zinc-500 dark:text-zinc-400"
          >
            Bạn muốn góp ý gì thêm không? (không bắt buộc)
          </label>
          <textarea
            id="feedback-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            placeholder="Ví dụ: thông tin lương chưa chính xác..."
            className="rounded-xl border border-zinc-300 bg-zinc-50 p-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="flex-1 rounded-full bg-brand px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
            >
              Gửi góp ý
            </button>
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="rounded-full border border-zinc-300 px-4 py-2 text-[13px] font-medium text-zinc-600 transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:text-zinc-300"
            >
              Bỏ qua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
