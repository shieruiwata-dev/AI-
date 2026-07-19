import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/generating")({
  component: GeneratingPage,
});

const statuses = [
  { at: 0, text: "準備をしています..." },
  { at: 15, text: "物語を書いています..." },
  { at: 55, text: "イラストを描いています..." },
  { at: 85, text: "ページを組み立てています..." },
  { at: 100, text: "完成しました！" },
];

function GeneratingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setTimeout(() => navigate({ to: "/preview/$id", params: { id: "demo" } }), 700);
          return 100;
        }
        return Math.min(100, p + 2);
      });
    }, 120);
    return () => clearInterval(id);
  }, [navigate]);

  const status = [...statuses].reverse().find((s) => progress >= s.at)?.text ?? "";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-md card-soft text-center">
          <div className="mx-auto relative h-28 w-28">
            <div className="absolute inset-0 rounded-full bg-[color:var(--butter)] animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center text-4xl">📖</div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[color:var(--coral)] animate-spin" />
          </div>
          <h1 className="mt-6 text-xl">{status}</h1>
          <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">絵本を生成中です。しばらくお待ちください。</p>
          <div className="mt-6">
            <div className="h-3 w-full rounded-full bg-[color:var(--muted)] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[color:var(--coral)] to-[color:var(--butter)] transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-sm font-semibold text-[color:var(--coral)]">{progress}%</div>
          </div>
        </div>
      </main>
    </div>
  );
}
