import { useEffect, useRef, useState } from "react";
import type { BookPage } from "@/lib/api";

// 本物の紙のようにめくれる絵本ビューア（3D rotateY + 紙のカール質感）。
// /preview（見開き2ページ）とスタジオ右ペイン（1ページ）で共用。

const DURATION = 700; // ms per page flip
const EASE = "cubic-bezier(0.42, 0, 0.2, 1)";

type Flip = { dir: 1 | -1; running: boolean };

// A single book page. `side` rounds only the outer corners so pages meet flat
// at the spine like a real book. Fixed geometry so the book never resizes.
function Page({ p, side }: { p: BookPage | null; side: "left" | "right" | "single" }) {
  const round =
    side === "left" ? "rounded-l-2xl" : side === "right" ? "rounded-r-2xl" : "rounded-2xl";
  const spineShadow =
    side === "left"
      ? "bg-gradient-to-l from-black/12 to-transparent right-0"
      : side === "right"
        ? "bg-gradient-to-r from-black/12 to-transparent left-0"
        : "hidden";
  if (!p)
    return (
      <div className={`flex flex-col bg-[color:var(--cream)] overflow-hidden ${round}`}>
        <div className="w-full aspect-[3/2]" />
        <div className="h-40 md:h-44" />
      </div>
    );
  return (
    <div className={`relative flex flex-col bg-white overflow-hidden ${round}`}>
      <div className={`pointer-events-none absolute inset-y-0 w-6 z-10 ${spineShadow}`} />
      <img src={p.image_url} alt={`ページ${p.page_number}のイラスト`} className="w-full aspect-[3/2] object-cover" draggable={false} />
      <div className="p-5 md:p-7 h-40 md:h-44 flex flex-col">
        <p className="text-base md:text-lg leading-loose flex-1 overflow-hidden" style={{ fontFamily: "var(--font-display)" }}>
          {p.text}
        </p>
        <div className="mt-2 text-xs text-[color:var(--muted-foreground)] text-right">— {p.page_number} —</div>
      </div>
    </div>
  );
}

export function FlipBook({
  pages,
  per = 1,
  keyboard = false,
  showIndicator = true,
  onIndexChange,
  className = "",
}: {
  pages: BookPage[];
  per?: 1 | 2;
  keyboard?: boolean;
  showIndicator?: boolean;
  onIndexChange?: (index: number) => void;
  className?: string;
}) {
  const total = pages.length;
  const [index, setIndex] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const drag = useRef<{ x: number } | null>(null);

  const P = (i: number) => (i >= 0 && i < total ? pages[i] : null);
  const lastIndex = Math.max(0, (Math.ceil(total / per) - 1) * per);
  const atStart = index === 0;
  const atEnd = index >= lastIndex;

  useEffect(() => {
    setIndex((i) => Math.min(Math.floor(i / per) * per, lastIndex));
  }, [per, lastIndex]);

  useEffect(() => {
    onIndexChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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

  // Keyboard (ignores keystrokes aimed at inputs, so it can live next to a chat box)
  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") startFlip(1);
      if (e.key === "ArrowLeft") startFlip(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboard, index, per, flip, lastIndex]);

  // Swipe
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

  const renderStatic = () =>
    per === 1 ? (
      <Page p={P(index)} side="single" />
    ) : (
      <div className="flex">
        <div className="w-1/2"><Page p={P(index)} side="left" /></div>
        <div className="w-1/2"><Page p={P(index + 1)} side="right" /></div>
      </div>
    );

  const renderFlip = (f: Flip) => {
    const end = f.dir === 1 ? -180 : 180;
    const rot = f.running ? end : 0;
    const trans = `transform ${DURATION}ms ${EASE}`;
    const shadeTrans = `opacity ${DURATION}ms ${EASE}`;

    let baseLeft: number, baseRight: number, frontIdx: number, backIdx: number;
    let leafStyle: React.CSSProperties;
    let frontSide: "left" | "right" | "single", backSide: "left" | "right" | "single";

    if (per === 2) {
      if (f.dir === 1) {
        baseLeft = index; baseRight = index + 3;
        frontIdx = index + 1; backIdx = index + 2;
        leafStyle = { left: "50%", width: "50%", top: 0, bottom: 0, transformOrigin: "left center" };
        frontSide = "right"; backSide = "left";
      } else {
        baseLeft = index - 2; baseRight = index + 1;
        frontIdx = index; backIdx = index - 1;
        leafStyle = { left: 0, width: "50%", top: 0, bottom: 0, transformOrigin: "right center" };
        frontSide = "left"; backSide = "right";
      }
    } else {
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
        <Page p={P(baseLeft)} side="single" />
      ) : (
        <div className="flex">
          <div className="w-1/2"><Page p={P(baseLeft)} side="left" /></div>
          <div className="w-1/2"><Page p={P(baseRight)} side="right" /></div>
        </div>
      );

    // Paper-curl treatment: dark rim + thin white highlight at the free edge,
    // plus a soft band of light sweeping across the face while it turns.
    const freeEdge = f.dir === 1 ? "right" : "left";
    const curl = (edge: "left" | "right"): React.CSSProperties => ({
      background:
        edge === "right"
          ? "linear-gradient(to left, rgba(0,0,0,0.20) 0%, rgba(255,255,255,0.30) 6%, rgba(255,255,255,0) 22%)"
          : "linear-gradient(to right, rgba(0,0,0,0.20) 0%, rgba(255,255,255,0.30) 6%, rgba(255,255,255,0) 22%)",
    });
    const sheen = (running: boolean): React.CSSProperties => ({
      backgroundImage: "linear-gradient(100deg, transparent 35%, rgba(255,255,255,0.45) 50%, transparent 65%)",
      backgroundSize: "250% 100%",
      backgroundRepeat: "no-repeat",
      backgroundPosition:
        f.dir === 1 ? (running ? "-30% 0" : "130% 0") : (running ? "130% 0" : "-30% 0"),
      transition: `background-position ${DURATION}ms ${EASE}`,
    });

    return (
      <>
        <Base />
        {/* ambient shadow the airborne leaf casts on the book */}
        <div
          className="pointer-events-none absolute inset-0 bg-black rounded-2xl"
          style={{ opacity: 0, animation: `ds-flip-cast ${DURATION}ms ${EASE} both` }}
        />
        <div
          className="absolute [transform-style:preserve-3d]"
          style={{ ...leafStyle, transform: `rotateY(${rot}deg)`, transition: trans, willChange: "transform" }}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <Page p={P(frontIdx)} side={frontSide} />
            <div className="pointer-events-none absolute inset-0" style={curl(freeEdge)} />
            <div className="pointer-events-none absolute inset-0" style={sheen(f.running)} />
            <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: f.running ? 0.28 : 0, transition: shadeTrans }} />
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden]" style={{ transform: "rotateY(180deg)" }}>
            <Page p={P(backIdx)} side={backSide} />
            <div className="pointer-events-none absolute inset-0" style={curl(freeEdge === "right" ? "left" : "right")} />
            <div className="pointer-events-none absolute inset-0" style={sheen(f.running)} />
            <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: f.running ? 0 : 0.28, transition: shadeTrans }} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={className}>
      <div className="relative">
        <div
          className="select-none"
          style={{ perspective: "1800px", touchAction: "pan-y" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <div className="relative rounded-2xl shadow-[0_18px_45px_-18px_rgba(120,90,70,0.5)]">
            {flip ? renderFlip(flip) : renderStatic()}
          </div>
        </div>

        <button
          onClick={() => startFlip(-1)}
          disabled={atStart || !!flip}
          className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20"
          aria-label="前へ"
        >
          ←
        </button>
        <button
          onClick={() => startFlip(1)}
          disabled={atEnd || !!flip}
          className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20"
          aria-label="次へ"
        >
          →
        </button>
      </div>

      {showIndicator && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {Array.from({ length: totalViews }).map((_, i) => (
              <span key={i} className={`h-2 rounded-full transition-all ${i === currentView ? "w-5 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]"}`} />
            ))}
          </div>
          <span key={index} className="text-sm text-[color:var(--muted-foreground)] tabular-nums animate-in fade-in zoom-in-95 duration-300">
            {pageLabel}
          </span>
        </div>
      )}
    </div>
  );
}
