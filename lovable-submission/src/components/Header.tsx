import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-1 sm:gap-2">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-base sm:text-lg">✦</span>
          <span className="text-base sm:text-lg font-bold tracking-tight truncate" style={{ fontFamily: "var(--font-display)" }}>
            DreamStories
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Link to="/mypage" className="btn-ghost text-sm whitespace-nowrap !px-2.5 sm:!px-3">マイページ</Link>
          <button className="btn-secondary text-sm whitespace-nowrap !py-2 !px-3 sm:!px-4">ログイン</button>
        </nav>
      </div>
    </header>
  );
}
