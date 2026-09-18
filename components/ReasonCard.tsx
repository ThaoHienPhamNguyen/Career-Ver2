const BANNER_STYLES = [
  "from-brand to-fuchsia-500",
  "from-amber-400 to-orange-500",
  "from-sky-400 to-blue-500",
  "from-violet-400 to-purple-500",
];

const NUMBER_TEXT_STYLES = ["text-brand", "text-orange-500", "text-blue-500", "text-purple-500"];

export function ReasonCard({
  index,
  icon,
  title,
  description,
  comingSoon,
}: {
  index: number;
  icon: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}) {
  const banner = BANNER_STYLES[(index - 1) % BANNER_STYLES.length];
  const numberClass = NUMBER_TEXT_STYLES[(index - 1) % NUMBER_TEXT_STYLES.length];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`relative flex h-28 items-center justify-center overflow-hidden bg-gradient-to-br ${banner}`}>
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center px-3 text-center font-heading text-2xl leading-none font-extrabold tracking-wide text-white/20 uppercase select-none"
        >
          {title}
        </span>
        <span className="relative text-4xl drop-shadow-sm" aria-hidden>
          {icon}
        </span>
        {comingSoon && (
          <span className="absolute top-2 right-2 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-zinc-700">
            Sắp ra mắt
          </span>
        )}
      </div>
      <div className="flex flex-col items-center gap-1.5 p-5 text-center">
        <span className={`font-heading text-xl font-extrabold ${numberClass}`}>#{index}</span>
        <h3 className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}
