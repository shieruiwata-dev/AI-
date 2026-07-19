import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/generating")({
  component: GeneratingPage,
});

// Stage → upper bound of progress + status text.
const STAGES = [
  { to: 20, text: "お子さまの世界を想像しています…" },
  { to: 50, text: "物語を書いています…" },
  { to: 90, text: "イラストを描いています…" },
  { to: 100, text: "絵本を仕上げています…" },
];
// Rough time budget per stage (ms). Spec: each ~20–30s. Pseudo only — replaced
// by the real Dify streaming progress in Week 5. Lower these to demo faster.
const STAGE_MS = [22000, 26000, 28000, 22000];
const TICK = 120;

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
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const pref = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      let p = pref.current;
      const si = Math.max(0, STAGES.findIndex((s) => p < s.to));
      const prevTo = si === 0 ? 0 : STAGES[si - 1].to;
      const range = STAGES[si].to - prevTo;
      const perTick = range / (STAGE_MS[si] / TICK);
      // Uneven, "living" progress.
      p = Math.min(100, p + perTick * (0.3 + Math.random() * 1.5));
      pref.current = p;
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setDone(true);
        setTimeout(() => navigate({ to: "/preview/$id", params: { id: "demo" } }), 2000);
      }
    }, TICK);
    return () => clearInterval(id);
  }, [navigate]);

  const pct = Math.min(100, Math.round(progress));
  const status = done
    ? "完成！プレビューへ移動します…"
    : (STAGES.find((s) => progress < s.to)?.text ?? STAGES[STAGES.length - 1].text);

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
