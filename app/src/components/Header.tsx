import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-lg">✦</span>
          <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            DreamStories
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/mypage" className="btn-ghost text-sm">マイページ</Link>
          <button className="btn-secondary text-sm !py-2 !px-4">ログイン</button>
        </nav>
      </div>
    </header>
  );
}
