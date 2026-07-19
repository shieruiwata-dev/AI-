import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toast } from "@/components/Toast";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

const TITLE = "たろうくんの ぼうけん";

// Placeholder image, self-contained SVG styled like placehold.co/600x400/FFE5A0/333
// (renders everywhere, including offline previews). Swap for real image URLs later.
const placeholder = (n: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#FFE5A0"/><text x="300" y="215" font-family="sans-serif" font-size="42" fill="#333333" text-anchor="middle">Page ${n}</text></svg>`,
  )}`;

const texts = [
  "むかしむかし、たろうくんは、ふしぎな もりへ でかけました。",
  "もりの いりぐちで、しろい うさぎに であいました。",
  "うさぎは「ぼくと いっしょに ぼうけんしない？」と いいました。",
  "ふたりは もりの おくへ すすんでいきます。",
  "きれいな はなばたけが ひろがっていました。",
  "そらには おおきな にじが かかっています。",
  "もりの くまさんも おともだちに なりました。",
  "やまの てっぺんを めざして のぼります。",
  "うみのような おおきな みずうみが みえました。",
  "さくらの きの したで ひとやすみ。",
  "よるには まんてんの ほしぞらが ひろがります。",
  "たろうくんの ぼうけんは、まだまだ つづきます。",
];

const pages = texts.map((text, i) => ({ n: i + 1, img: placeholder(i + 1), text }));

function PreviewPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const per = isMobile ? 1 : 2; // PC: 見開き2ページ / スマホ: 1ページ
  const total = pages.length;

  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const touchX = useRef<number | null>(null);

  // Keep the view aligned to a spread boundary when the layout switches.
  useEffect(() => {
    setIndex((i) => Math.floor(i / per) * per);
  }, [per]);

  const lastIndex = (Math.ceil(total / per) - 1) * per;
  const atStart = index === 0;
  const atEnd = index >= lastIndex;
  const go = (dir: number) => setIndex((i) => Math.max(0, Math.min(i + dir * per, lastIndex)));

  // Keyboard arrows.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [per, lastIndex]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const shown = pages.slice(index, index + per);
  const totalViews = Math.ceil(total / per);
  const currentView = Math.floor(index / per);
  const pageLabel = per > 1 ? `${index + 1}–${Math.min(index + per, total)} / ${total}` : `${index + 1} / ${total}`;

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--cream)]">
      {/* Header: back / title / share */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.history.back()}
            className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]"
            aria-label="戻る"
          >
            ←
          </button>
          <div className="font-bold truncate text-center" style={{ fontFamily: "var(--font-display)" }}>
            {TITLE}
          </div>
          <button
            onClick={() => setToast("共有リンクをコピーしました")}
            className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]"
            aria-label="共有"
          >
            🔗
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        <div className="text-center text-xs text-[color:var(--muted-foreground)] mb-3">プレビュー #{id}</div>

        {/* Spread */}
        <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 animate-in fade-in duration-300"
          >
            {shown.map((p) => (
              <div
                key={p.n}
                className="rounded-2xl overflow-hidden bg-white border border-[color:var(--border)] shadow-[0_10px_30px_-14px_rgba(120,90,70,0.35)]"
              >
                <img src={p.img} alt={`ページ${p.n}のイラスト`} className="w-full aspect-[3/2] object-cover" />
                <div className="p-5 md:p-7">
                  <p className="text-base md:text-lg leading-loose" style={{ fontFamily: "var(--font-display)" }}>
                    {p.text}
                  </p>
                  <div className="mt-4 text-xs text-[color:var(--muted-foreground)] text-right">— {p.n} —</div>
                </div>
              </div>
            ))}
          </div>

          {/* Big arrows */}
          <button
            onClick={() => go(-1)}
            disabled={atStart}
            className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition"
            aria-label="前へ"
          >
            ←
          </button>
          <button
            onClick={() => go(1)}
            disabled={atEnd}
            className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition"
            aria-label="次へ"
          >
            →
          </button>
        </div>

        {/* Page indicator */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalViews }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i === currentView ? "w-5 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]"}`}
              />
            ))}
          </div>
          <span className="text-sm text-[color:var(--muted-foreground)] tabular-nums">{pageLabel}</span>
        </div>
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
