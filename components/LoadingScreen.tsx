export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24"
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span aria-hidden className="compass-pulse absolute inset-0 rounded-full bg-brand" />
        <span aria-hidden className="compass-spin relative text-5xl">
          🧭
        </span>
      </div>
      <p className="font-heading text-base font-semibold text-zinc-700 dark:text-zinc-300">
        AI đang suy nghĩ kỹ lắm rồi, chờ xíu nha!
      </p>
    </div>
  );
}
