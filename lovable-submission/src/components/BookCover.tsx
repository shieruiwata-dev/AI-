// A little picture-book cover: white spine, big art, and a title-bar skeleton.
// Shared by the landing hero/gallery and the mypage library cards.
export function BookCover({
  emoji,
  tone,
  size = "text-4xl md:text-5xl",
  className = "",
  children,
}: {
  emoji: string;
  tone: string;
  size?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative aspect-[3/4] rounded-xl shadow-md bg-gradient-to-br ${tone} overflow-hidden ${className}`}>
      <div className="absolute inset-y-0 left-0 w-1.5 bg-white/60" />
      <div className="absolute inset-y-0 left-1.5 w-px bg-black/10" />
      <div className={`absolute inset-0 flex items-center justify-center ${size} drop-shadow-sm`}>{emoji}</div>
      <div className="absolute left-4 right-4 bottom-3 space-y-1.5">
        <div className="h-1.5 rounded-full bg-white/80 w-3/4" />
        <div className="h-1 rounded-full bg-white/55 w-1/2" />
      </div>
      {children}
    </div>
  );
}
