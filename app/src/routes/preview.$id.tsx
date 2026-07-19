import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toast } from "@/components/Toast";
import { FlipBook } from "@/components/FlipBook";
import { getBook, type BookPage } from "@/lib/api";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

function PreviewPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const per = isMobile ? 1 : 2;

  // 絵本データはAPI経由で取得（今はモック。WEEK6: Supabase booksテーブルに差し替え）
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState<BookPage[]>([]);
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getBook(id).then((b) => {
      if (!alive) return;
      setTitle(b.title);
      setPages(b.pages);
    });
    return () => { alive = false; };
  }, [id]);

  const total = pages.length;
  const lastIndex = Math.max(0, (Math.ceil(total / per) - 1) * per);
  const atEnd = total > 0 && index >= lastIndex;
  const stageMax = isMobile ? 460 : 880;

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--cream)]">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.history.back()} className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" aria-label="戻る">←</button>
          <div className="font-bold truncate text-center" style={{ fontFamily: "var(--font-display)" }}>{title || "読み込み中…"}</div>
          <button onClick={() => setToast("共有リンクをコピーしました")} className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" aria-label="共有">🔗</button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        <div className="text-center text-xs text-[color:var(--muted-foreground)] mb-3">プレビュー #{id}</div>
        {total > 0 && (
          <div className="mx-auto w-full" style={{ maxWidth: stageMax }}>
            <FlipBook pages={pages} per={per} keyboard onIndexChange={setIndex} />
          </div>
        )}
      </main>

      {/* Fixed purchase button */}
      <div className="sticky bottom-0 border-t border-[color:var(--border)] bg-[color:var(--cream)]/90 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Link
            to="/checkout/$id"
            params={{ id }}
            className={`btn-primary w-full text-base !py-4 transition ${atEnd ? "ring-4 ring-[color:var(--butter)] scale-[1.01]" : ""}`}
          >
            この絵本を購入する（5,000円）
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
