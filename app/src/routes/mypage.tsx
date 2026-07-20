import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookCover } from "@/components/BookCover";
import { listBooks, type LibraryBook } from "@/lib/api";

export const Route = createFileRoute("/mypage")({
  component: MyPage,
});

function MyPage() {
  // 一覧はAPI経由で取得（今はモック。WEEK6: Supabase booksテーブルに差し替え）
  const [books, setBooks] = useState<LibraryBook[]>([]);
  useEffect(() => {
    let alive = true;
    listBooks().then((b) => { if (alive) setBooks(b); });
    return () => { alive = false; };
  }, []);

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
          {books.map((b) => {
            const purchased = b.status === "paid";
            const failed = b.status === "failed";
            return (
              <div
                key={b.id}
                className="group card-soft flex flex-col transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl"
              >
                {/* Book cover — lifts and tilts slightly on hover, like picking it up */}
                <div className="transition-transform duration-300 ease-out group-hover:-translate-y-2 group-hover:rotate-[-1.5deg] group-hover:scale-[1.02]">
                  <BookCover
                    emoji={b.cover_emoji}
                    tone={b.cover_tone}
                    size="text-6xl"
                    className="shadow-[0_10px_24px_-12px_rgba(120,90,70,0.45)] transition-shadow duration-300 group-hover:shadow-[0_20px_36px_-14px_rgba(120,90,70,0.55)]"
                  >
                    {!purchased && (
                      <span className={`absolute top-3 right-3 rounded-full text-white text-[11px] font-bold px-2.5 py-1 shadow ${failed ? "bg-[color:var(--muted-foreground)]" : "bg-[color:var(--coral)]"}`}>
                        {failed ? "生成失敗" : "未購入"}
                      </span>
                    )}
                  </BookCover>
                </div>
                <h3 className="mt-4 text-base">{b.title}</h3>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {purchased ? `購入日: ${b.created_at}` : failed ? "生成に失敗しました" : "まだ購入されていません"}
                </p>
                <div className="mt-4">
                  {purchased ? (
                    <Link to="/preview/$id" params={{ id: b.id }} className="btn-secondary w-full text-sm">開く</Link>
                  ) : failed ? (
                    <Link to="/create" className="btn-secondary w-full text-sm">もう一度作る</Link>
                  ) : (
                    <Link to="/checkout/$id" params={{ id: b.id }} className="btn-primary w-full text-sm">購入する</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
