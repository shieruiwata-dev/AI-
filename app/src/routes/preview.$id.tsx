import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Toast } from "@/components/Toast";

export const Route = createFileRoute("/preview/$id")({
  component: PreviewPage,
});

const TITLE = "たろうくんの ぼうけん";
const DURATION = 700; // ms per page flip
const EASE = "cubic-bezier(0.42, 0, 0.2, 1)";

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
const P = (i: number) => (i >= 0 && i < pages.length ? pages[i] : null);

// A single book page. `side` rounds only the outer corners so pages meet flat
// at the spine like a real book.
function Page({ p, side }: { p: (typeof pages)[number] | null; side: "left" | "right" | "single" }) {
  const round =
    side === "left" ? "rounded-l-2xl" : side === "right" ? "rounded-r-2xl" : "rounded-2xl";
  const spineShadow =
    side === "left"
      ? "bg-gradient-to-l from-black/12 to-transparent right-0"
      : side === "right"
        ? "bg-gradient-to-r from-black/12 to-transparent left-0"
        : "hidden";
  if (!p) return <div className={`h-full bg-[color:var(--cream)] ${round}`} />;
  return (
    <div className={`relative h-full flex flex-col bg-white overflow-hidden ${round}`}>
      <div className={`pointer-events-none absolute inset-y-0 w-6 z-10 ${spineShadow}`} />
      <img src={p.img} alt={`ページ${p.n}のイラスト`} className="w-full aspect-[3/2] object-cover" draggable={false} />
      <div className="p-5 md:p-7 flex-1">
        <p className="text-base md:text-lg leading-loose" style={{ fontFamily: "var(--font-display)" }}>
          {p.text}
        </p>
        <div className="mt-4 text-xs text-[color:var(--muted-foreground)] text-right">— {p.n} —</div>
      </div>
    </div>
  );
}

type Flip = { dir: 1 | -1; running: boolean };

function PreviewPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const per = isMobile ? 1 : 2;
  const total = pages.length;

  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const drag = useRef<{ x: number } | null>(null);

  useEffect(() => {
    setIndex((i) => Math.floor(i / per) * per);
  }, [per]);

  const lastIndex = (Math.ceil(total / per) - 1) * per;
  const atStart = index === 0;
  const atEnd = index >= lastIndex;

  const startFlip = (dir: 1 | -1) => {
    if (flip) return;
    if (dir === 1 && atEnd) return;
    if (dir === -1 && atStart) return;
    setFlip({ dir, running: false });
  };

  // Drive the flip: kick the transition, then commit the index when it ends.
  useEffect(() => {
    if (!flip) return;
    if (!flip.running) {
      let r2 = 0;
      const r1 = requestAnimationFrame(() => {
        r2 = requestAnimationFrame(() => setFlip((f) => (f ? { ...f, running: true } : f)));
      });
      return () => {
        cancelAnimationFrame(r1);
        if (r2) cancelAnimationFrame(r2);
      };
    }
    const t = setTimeout(() => {
      setIndex((i) => (flip.dir === 1 ? Math.min(i + per, lastIndex) : Math.max(i - per, 0)));
      setFlip(null);
    }, DURATION);
    return () => clearTimeout(t);
  }, [flip, per, lastIndex]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") startFlip(1);
      if (e.key === "ArrowLeft") startFlip(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flip, index, per]);

  // Swipe (trigger a flip)
  const onPointerDown = (e: React.PointerEvent) => {
    if (!flip) drag.current = { x: e.clientX };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    if (dx > 45) startFlip(1);
    else if (dx < -45) startFlip(-1);
  };

  const totalViews = Math.ceil(total / per);
  const currentView = Math.floor(index / per);
  const pageLabel = per > 1 ? `${index + 1}–${Math.min(index + per, total)} / ${total}` : `${index + 1} / ${total}`;

  const stageMax = isMobile ? 460 : 880;

  // ----- Book area -----
  const renderStatic = () =>
    per === 1 ? (
      <div className="h-full">
        <Page p={P(index)} side="single" />
      </div>
    ) : (
      <div className="flex items-stretch h-full">
        <div className="w-1/2">
          <Page p={P(index)} side="left" />
        </div>
        <div className="w-1/2">
          <Page p={P(index + 1)} side="right" />
        </div>
      </div>
    );

  const renderFlip = (f: Flip) => {
    const end = f.dir === 1 ? -180 : 180;
    const rot = f.running ? end : 0;
    const trans = `transform ${DURATION}ms ${EASE}`;
    const shadeTrans = `opacity ${DURATION}ms ${EASE}`;

    // page numbers for base + leaf faces
    let baseLeft: number, baseRight: number, frontIdx: number, backIdx: number;
    let leafStyle: React.CSSProperties;
    let frontSide: "left" | "right" | "single", backSide: "left" | "right" | "single";

    if (per === 2) {
      if (f.dir === 1) {
        // next: right leaf flips left
        baseLeft = index; baseRight = index + 3;
        frontIdx = index + 1; backIdx = index + 2;
        leafStyle = { left: "50%", width: "50%", top: 0, bottom: 0, transformOrigin: "left center" };
        frontSide = "right"; backSide = "left";
      } else {
        // prev: left leaf flips right
        baseLeft = index - 2; baseRight = index + 1;
        frontIdx = index; backIdx = index - 1;
        leafStyle = { left: 0, width: "50%", top: 0, bottom: 0, transformOrigin: "right center" };
        frontSide = "left"; backSide = "right";
      }
    } else {
      // mobile single page
      if (f.dir === 1) {
        baseLeft = index + 1; baseRight = index + 1;
        frontIdx = index; backIdx = index + 1;
        leafStyle = { inset: 0, transformOrigin: "left center" };
      } else {
        baseLeft = index - 1; baseRight = index - 1;
        frontIdx = index; backIdx = index - 1;
        leafStyle = { inset: 0, transformOrigin: "right center" };
      }
      frontSide = "single"; backSide = "single";
    }

    const Base = () =>
      per === 1 ? (
        <div className="h-full"><Page p={P(baseLeft)} side="single" /></div>
      ) : (
        <div className="flex items-stretch h-full">
          <div className="w-1/2"><Page p={P(baseLeft)} side="left" /></div>
          <div className="w-1/2"><Page p={P(baseRight)} side="right" /></div>
        </div>
      );

    return (
      <>
        <Base />
        <div
          className="absolute [transform-style:preserve-3d]"
          style={{ ...leafStyle, transform: `rotateY(${rot}deg)`, transition: trans, willChange: "transform" }}
        >
          {/* front face (leaving page) */}
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <Page p={P(frontIdx)} side={frontSide} />
            <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: f.running ? 0.28 : 0, transition: shadeTrans }} />
          </div>
          {/* back face (arriving page), pre-rotated */}
          <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: "rotateY(180deg)" }}>
            <Page p={P(backIdx)} side={backSide} />
            <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: f.running ? 0 : 0.28, transition: shadeTrans }} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--cream)]">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => router.history.back()} className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" aria-label="戻る">←</button>
          <div className="font-bold truncate text-center" style={{ fontFamily: "var(--font-display)" }}>{TITLE}</div>
          <button onClick={() => setToast("共有リンクをコピーしました")} className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" aria-label="共有">🔗</button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-6">
        <div className="text-center text-xs text-[color:var(--muted-foreground)] mb-3">プレビュー #{id}</div>

        <div className="relative">
          {/* Book stage with 3D perspective */}
          <div
            className="mx-auto w-full select-none"
            style={{ maxWidth: stageMax, perspective: "1800px", touchAction: "pan-y" }}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
          >
            <div className="relative rounded-2xl shadow-[0_18px_45px_-18px_rgba(120,90,70,0.5)]">
              {flip ? renderFlip(flip) : renderStatic()}
            </div>
          </div>

          {/* Big arrows */}
          <button onClick={() => startFlip(-1)} disabled={atStart || !!flip} className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20" aria-label="前へ">←</button>
          <button onClick={() => startFlip(1)} disabled={atEnd || !!flip} className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20" aria-label="次へ">→</button>
        </div>

        {/* Page indicator */}
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalViews }).map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === currentView ? "w-5 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]"}`} />
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
          <Link to="/checkout/$id" params={{ id }} className={`btn-primary w-full text-base !py-4 transition ${atEnd ? "ring-4 ring-[color:var(--butter)] scale-[1.01]" : ""}`}>
            この絵本を購入する（5,000円）
          </Link>
        </div>
      </div>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
