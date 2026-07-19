import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/mypage")({
  component: MyPage,
});

const books = [
  { id: "demo", title: "ゆうきくんの森の冒険", date: "2025-07-15", emoji: "🌳", purchased: true },
  { id: "b2", title: "さくらちゃんとお星さま", date: "2025-06-30", emoji: "⭐", purchased: true },
  { id: "b3", title: "ひろとの海の大冒険", date: "-", emoji: "🌊", purchased: false },
];

function MyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl">マイページ</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">あなたの絵本コレクション</p>
          </div>
          <Link to="/create" className="btn-primary !py-3 !px-5 text-sm">新しい絵本を作る</Link>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <div key={b.id} className="card-soft flex flex-col">
              <div className="relative aspect-[3/4] rounded-2xl bg-gradient-to-br from-[color:var(--sky)]/40 via-[color:var(--butter)]/40 to-[color:var(--coral)]/40 flex items-center justify-center text-6xl">
                {b.emoji}
                {!b.purchased && (
                  <span className="absolute top-3 right-3 rounded-full bg-[color:var(--coral)] text-white text-[11px] font-bold px-2.5 py-1 shadow">未購入</span>
                )}
              </div>
              <h3 className="mt-4 text-base">{b.title}</h3>
              <p className="text-xs text-[color:var(--muted-foreground)]">
                {b.purchased ? `購入日: ${b.date}` : "まだ購入されていません"}
              </p>
              <div className="mt-4">
                {b.purchased ? (
                  <Link to="/preview/$id" params={{ id: b.id }} className="btn-secondary w-full text-sm">開く</Link>
                ) : (
                  <Link to="/checkout/$id" params={{ id: b.id }} className="btn-primary w-full text-sm">購入する</Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
