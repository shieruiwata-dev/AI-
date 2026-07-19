import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { generateStory, loadExtractedParams, type GenerateProgress } from "@/lib/api";

export const Route = createFileRoute("/generating")({
  component: GeneratingPage,
});

// stage（APIの進捗イベント）→ 画面に出すステータス文言
const STAGE_TEXT: Record<GenerateProgress["stage"], string> = {
  imagining: "お子さまの世界を想像しています…",
  story_generation: "物語を書いています…",
  image_generation: "イラストを描いています…",
  finalize: "絵本を仕上げています…",
};

// Floating background sparkles (subtle).
const sparkles = [
  { e: "⭐", left: "12%", delay: "0s", speed: "7s", size: "text-lg" },
  { e: "💗", left: "24%", delay: "2.4s", speed: "8s", size: "text-sm" },
  { e: "✨", left: "38%", delay: "1.2s", speed: "6.5s", size: "text-base" },
  { e: "🌟", left: "52%", delay: "3.1s", speed: "7.5s", size: "text-sm" },
  { e: "💗", left: "66%", delay: "0.6s", speed: "8.5s", size: "text-base" },
  { e: "✨", left: "78%", delay: "2s", speed: "6.8s", size: "text-lg" },
  { e: "⭐", left: "88%", delay: "3.6s", speed: "7.2s", size: "text-sm" },
  { e: "🌙", left: "6%", delay: "1.8s", speed: "9s", size: "text-base" },
];

function GeneratingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<GenerateProgress>({ percent: 0, stage: "imagining" });
  const [done, setDone] = useState(false);

  useEffect(() => {
    // 各マウントが自分の生成を開始し、アンマウント時にabortで中断する
    // （開発時のStrictMode再マウントでも正しく動く標準形）
    const ac = new AbortController();

    // チャットで収集したパラメータを読み出して生成APIへ。
    // WEEK5: generateStory の中身をEdge Function呼び出しに差し替えるだけで、
    //        この画面は修正不要（api.ts参照）。
    const params = loadExtractedParams();
    generateStory(params, setProgress, ac.signal)
      .then((book) => {
        setDone(true);
        setTimeout(() => navigate({ to: "/preview/$id", params: { id: book.book_id } }), 2000);
      })
      .catch((e: unknown) => {
        if ((e as DOMException)?.name === "AbortError") return;
        // WEEK5: 失敗レスポンス時は「もう一度作る」導線を表示する予定
        console.error(e);
      });

    return () => ac.abort();
  }, [navigate]);

  const pct = progress.percent;
  const status = done ? "完成！プレビューへ移動します…" : STAGE_TEXT[progress.stage];

  // Circular ring geometry.
  const R = 95;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - pct / 100);

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--cream)]">
      <Header />
      <main className="relative flex-1 flex items-center justify-center px-4 overflow-hidden">
        {/* floating sparkles */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {sparkles.map((s, i) => (
            <span
              key={i}
              className={`ds-rise absolute bottom-10 ${s.size}`}
              style={{ left: s.left, ["--rspeed" as string]: s.speed, animationDelay: s.delay }}
            >
              {s.e}
            </span>
          ))}
        </div>

        <div className="relative w-full max-w-md card-soft text-center">
          {/* circular progress */}
          <div className="relative mx-auto h-56 w-56">
            <svg viewBox="0 0 220 220" className="h-56 w-56 -rotate-90">
              <defs>
                <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FF9AA2" />
                  <stop offset="0.6" stopColor="#FFB3A7" />
                  <stop offset="1" stopColor="#FFE5A0" />
                </linearGradient>
              </defs>
              <circle cx="110" cy="110" r={R} fill="none" stroke="var(--muted)" strokeWidth="16" />
              <circle
                cx="110"
                cy="110"
                r={R}
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.25s ease" }}
              />
            </svg>
            {/* percentage */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-bold text-[color:var(--coral)] tabular-nums leading-none" style={{ fontFamily: "var(--font-display)" }}>
                {pct}
                <span className="text-2xl align-top">%</span>
              </span>
              <span className="mt-1 text-xs text-[color:var(--muted-foreground)]">生成中</span>
            </div>
          </div>

          {/* status text (fades in on change) */}
          <div className="mt-8 h-7">
            <p key={status} className="animate-in fade-in duration-500 text-lg font-semibold text-[color:var(--foreground)]">
              {status}
            </p>
          </div>
          <p className="mt-2 text-xs text-[color:var(--muted-foreground)]">
            {done ? "もうすぐできあがります 🎉" : "絵本ができるまで、少しだけお待ちください。"}
          </p>
        </div>
      </main>
    </div>
  );
}
