import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookCover } from "@/components/BookCover";

export const Route = createFileRoute("/mypage")({
  component: MyPage,
});

const books = [
  { id: "demo", title: "ゆうきくんの森の冒険", date: "2025-07-15", emoji: "🌳", purchased: true, tone: "from-[color:var(--sky)] to-[color:var(--butter)]" },
  { id: "b2", title: "さくらちゃんとお星さま", date: "2025-06-30", emoji: "⭐", purchased: true, tone: "from-[color:var(--butter)] to-[#FFB3A7]" },
  { id: "b3", title: "ひろとの海の大冒険", date: "-", emoji: "🌊", purchased: false, tone: "from-[color:var(--sky)] to-[#7FBEDB]" },
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
            <div
              key={b.id}
              className="group card-soft flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
            >
              {/* Book cover — lifts and tilts slightly on hover, like picking it up */}
              <div className="transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:rotate-[-1.5deg] group-hover:scale-[1.02]">
                <BookCover
                  emoji={b.emoji}
                  tone={b.tone}
                  size="text-6xl"
                  className="shadow-[0_10px_24px_-12px_rgba(120,90,70,0.45)] transition-shadow duration-300 group-hover:shadow-[0_20px_36px_-14px_rgba(120,90,70,0.55)]"
                >
                  {!b.purchased && (
                    <span className="absolute top-3 right-3 rounded-full bg-[color:var(--coral)] text-white text-[11px] font-bold px-2.5 py-1 shadow">未購入</span>
                  )}
                </BookCover>
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
