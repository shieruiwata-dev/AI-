import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toast } from "@/components/Toast";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

const TITLE = "たろうくんの ぼうけん";
const DURATION = 400; // ms

// Placeholder image, self-contained SVG styled like placehold.co/600x400/FFE5A0/333.
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

// Soft "swish" page-turn sound (Web Audio, no asset). Optional; fails silently.
let audioCtx: AudioContext | null = null;
function playSwish() {
  try {
    const AC = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    const ctx = audioCtx;
    const dur = 0.18;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      const t = i / d.length;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start();
  } catch {
    /* audio unavailable — ignore */
  }
}

function PageCard({ p }: { p: { n: number; img: string; text: string } }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-white border border-[color:var(--border)] shadow-[0_10px_30px_-14px_rgba(120,90,70,0.4)]">
      {/* paper-edge shadows */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/10 to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-5 bg-gradient-to-l from-black/10 to-transparent z-10" />
      <img src={p.img} alt={`ページ${p.n}のイラスト`} className="w-full aspect-[3/2] object-cover" draggable={false} />
      <div className="p-5 md:p-7 min-h-[7rem]">
        <p className="text-base md:text-lg leading-loose" style={{ fontFamily: "var(--font-display)" }}>
          {p.text}
        </p>
        <div className="mt-4 text-xs text-[color:var(--muted-foreground)] text-right">— {p.n} —</div>
      </div>
    </div>
  );
}

function PreviewPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const per = isMobile ? 1 : 2;
  const total = pages.length;

  const [index, setIndex] = useState(0);
  const [sliding, setSliding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ active: boolean; startX: number; w: number; dx: number }>({ active: false, startX: 0, w: 0, dx: 0 });

  useEffect(() => {
    setIndex((i) => Math.floor(i / per) * per);
  }, [per]);

  const lastIndex = (Math.ceil(total / per) - 1) * per;
  const atStart = index === 0;
  const atEnd = index >= lastIndex;

  const setTrack = (px: number, animate: boolean) => {
    const t = trackRef.current;
    if (!t) return;
    t.style.transition = animate ? `transform ${DURATION}ms ease-out` : "none";
    t.style.transform = `translateX(${px}px)`;
  };

  // dir: +1 = next (track moves right, next enters from left), -1 = prev
  const slide = (dir: 1 | -1) => {
    if (sliding || drag.current.active) return;
    if (dir === 1 && atEnd) return;
    if (dir === -1 && atStart) return;
    const w = viewportRef.current?.clientWidth ?? 0;
    setSliding(true);
    setTrack(0, false);
    // next frame: animate
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTrack(dir * w, true));
    });
    window.setTimeout(() => {
      playSwish();
      setIndex((i) => Math.max(0, Math.min(i + dir * per, lastIndex)));
      setTrack(0, false);
      setSliding(false);
    }, DURATION);
  };

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") slide(1);
      if (e.key === "ArrowLeft") slide(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, per, sliding]);

  // Pointer drag (finger-follow)
  const onPointerDown = (e: React.PointerEvent) => {
    if (sliding) return;
    drag.current = { active: true, startX: e.clientX, w: viewportRef.current?.clientWidth ?? 0, dx: 0 };
    setTrack(0, false);
    viewportRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    let dx = e.clientX - drag.current.startX;
    if ((dx > 0 && atEnd) || (dx < 0 && atStart)) dx *= 0.25; // rubber-band at edges
    drag.current.dx = dx;
    setTrack(dx, false);
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    const { w, dx } = drag.current;
    const threshold = w * 0.22;
    if (dx > threshold && !atEnd) {
      setSliding(true);
      setTrack(w, true);
      window.setTimeout(() => { playSwish(); setIndex((i) => Math.min(i + per, lastIndex)); setTrack(0, false); setSliding(false); }, DURATION);
    } else if (dx < -threshold && !atStart) {
      setSliding(true);
      setTrack(-w, true);
      window.setTimeout(() => { playSwish(); setIndex((i) => Math.max(i - per, 0)); setTrack(0, false); setSliding(false); }, DURATION);
    } else {
      setTrack(0, true); // snap back
    }
  };

  const totalViews = Math.ceil(total / per);
  const currentView = Math.floor(index / per);
  const pageLabel = per > 1 ? `${index + 1}–${Math.min(index + per, total)} / ${total}` : `${index + 1} / ${total}`;

  const view = (start: number) => {
    const items = pages.slice(start, start + per);
    if (items.length === 0) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {items.map((p) => (
          <PageCard key={p.n} p={p} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--cream)]">
      {/* Header */}
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

        <div className="relative">
          {/* Sliding viewport (3-layer filmstrip: next[left] / current[center] / prev[right]) */}
          <div
            ref={viewportRef}
            className="overflow-hidden select-none"
            style={{ touchAction: "pan-y" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div ref={trackRef} className="relative will-change-transform" style={{ transform: "translateX(0)" }}>
              {/* current — in flow, defines height */}
              {view(index)}
              {/* next — off-screen left */}
              <div className="absolute inset-0" style={{ transform: "translateX(-100%)" }}>{view(index + per)}</div>
              {/* prev — off-screen right */}
              <div className="absolute inset-0" style={{ transform: "translateX(100%)" }}>{view(index - per)}</div>
            </div>
          </div>

          {/* Big arrows (disabled while sliding / at edges) */}
          <button
            onClick={() => slide(-1)}
            disabled={atStart || sliding}
            className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20"
            aria-label="前へ"
          >
            ←
          </button>
          <button
            onClick={() => slide(1)}
            disabled={atEnd || sliding}
            className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20"
            aria-label="次へ"
          >
            →
          </button>
        </div>

        {/* Page indicator — number softly pops on change (key remount) */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalViews }).map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${i === currentView ? "w-5 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]"}`}
              />
            ))}
          </div>
          <span key={index} className="text-sm text-[color:var(--muted-foreground)] tabular-nums animate-in fade-in zoom-in-95 duration-300">
            {pageLabel}
          </span>
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
