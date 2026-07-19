import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

const pages = Array.from({ length: 12 }, (_, i) => ({
  n: i + 1,
  emoji: ["🌅","🐰","🌳","🦋","🏞️","🌈","🐻","⛰️","🌊","🌸","⭐","🎉"][i],
  text: [
    "ある日、ゆうきくんは不思議な森へと出かけました。",
    "森の入口で、白いうさぎに出会いました。",
    "うさぎは「ぼくと一緒に冒険しない？」と言いました。",
    "二人は森の奥へと進んでいきます。",
    "美しい花畑が広がっていました。",
    "空には大きな虹がかかっています。",
    "森のクマさんもお友だちになりました。",
    "山の頂上を目指して登ります。",
    "海のような広い湖が見えました。",
    "桜の木の下でひと休み。",
    "夜には満天の星空が広がります。",
    "ゆうきくんの冒険は、まだまだ続きます。",
  ][i],
}));

function PreviewPage() {
  const { id } = Route.useParams();
  const [page, setPage] = useState(0);
  const current = pages[page];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-6">
        <div className="text-center text-sm text-[color:var(--muted-foreground)] mb-3">プレビュー #{id}</div>

        <div className="relative">
          <div className="card-soft !p-0 overflow-hidden aspect-[4/5] md:aspect-[3/2] flex flex-col md:flex-row">
            <div className="flex-1 bg-gradient-to-br from-[color:var(--sky)]/40 via-[color:var(--butter)]/40 to-[color:var(--coral)]/30 flex items-center justify-center text-8xl md:text-9xl">
              {current.emoji}
            </div>
            <div className="md:w-2/5 p-6 md:p-10 flex flex-col justify-center bg-white">
              <p className="text-lg md:text-xl leading-relaxed" style={{ fontFamily: "var(--font-display)" }}>
                {current.text}
              </p>
              <div className="mt-6 text-xs text-[color:var(--muted-foreground)]">ページ {current.n} / {pages.length}</div>
            </div>
          </div>

          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white shadow-md border border-[color:var(--border)] disabled:opacity-40"
            aria-label="前のページ"
          >←</button>
          <button
            onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
            disabled={page === pages.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white shadow-md border border-[color:var(--border)] disabled:opacity-40"
            aria-label="次のページ"
          >→</button>
        </div>

        <div className="mt-4 flex justify-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]"}`}
              aria-label={`ページ ${i + 1}`}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link to="/checkout/$id" params={{ id }} className="btn-primary text-base">
            この絵本を購入する
          </Link>
        </div>
      </main>
    </div>
  );
}
