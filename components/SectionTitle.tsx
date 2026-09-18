export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-5 w-1.5 rounded-full bg-brand" />
      <h3 className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-100">
        {children}
      </h3>
    </div>
  );
}
