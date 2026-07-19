export function Loading({ label = "読み込み中..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-[color:var(--butter)]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[color:var(--coral)] animate-spin" />
      </div>
      <p className="text-sm text-[color:var(--muted-foreground)]">{label}</p>
    </div>
  );
}
