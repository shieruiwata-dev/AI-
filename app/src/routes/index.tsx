import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

// Self-contained placeholder illustration (inline SVG data URI) so it renders
// everywhere, including offline previews. Warm scene: a family reading a book.
const heroArt = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480" role="img">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#A8D8EA"/><stop offset="0.55" stop-color="#FFE5A0"/><stop offset="1" stop-color="#FF9AA2"/>
      </linearGradient>
      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#FFF3E9"/>
      </linearGradient>
    </defs>
    <rect width="600" height="480" rx="28" fill="url(#bg)" opacity="0.35"/>
    <g opacity="0.9">
      <circle cx="105" cy="90" r="10" fill="#fff"/><circle cx="500" cy="70" r="7" fill="#fff"/>
      <circle cx="530" cy="150" r="10" fill="#fff"/><circle cx="70" cy="200" r="7" fill="#fff"/>
      <path d="M470 120 l8 16 18 3 -13 13 3 18 -16 -8 -16 8 3 -18 -13 -13 18 -3z" fill="#FFE5A0"/>
    </g>
    <g>
      <circle cx="205" cy="175" r="42" fill="#F7C9A6"/>
      <path d="M163 168 a42 42 0 0 1 84 0 a70 40 0 0 0 -84 0z" fill="#6B4A3A"/>
      <path d="M150 330 q55 -95 110 0z" fill="#FF9AA2"/>
    </g>
    <g>
      <circle cx="360" cy="205" r="34" fill="#F7C9A6"/>
      <path d="M326 200 a34 34 0 0 1 68 0 a55 32 0 0 0 -68 0z" fill="#3A2E28"/>
      <path d="M316 345 q44 -80 88 0z" fill="#A8D8EA"/>
    </g>
    <g>
      <path d="M150 345 q140 -55 300 0 v70 q-150 -50 -300 0z" fill="url(#pg)" stroke="#F3E4D6" stroke-width="3"/>
      <path d="M300 320 v100" stroke="#E7C9A6" stroke-width="4"/>
      <g stroke="#E9D9C6" stroke-width="4" stroke-linecap="round">
        <path d="M185 360 h95"/><path d="M185 378 h95"/><path d="M185 396 h70"/>
        <path d="M320 360 h95"/><path d="M320 378 h95"/><path d="M345 396 h70"/>
      </g>
    </g>
  </svg>`,
)}`;

const features = [
  { icon: "🖋️", title: "AIが物語を紡ぐ", desc: "GPT-4があなたのお子さまだけの物語を作成します。" },
  { icon: "📖", title: "12ページのフルカラー絵本", desc: "美しいイラストと共に、本格的な絵本仕様でお届けします。" },
  { icon: "🎋", title: "日本文化がいっぱい", desc: "桜・お祭り・招き猫など、日本らしい要素が物語を彩ります。" },
];

const steps = [
  { n: 1, title: "お子さまの情報を入力", desc: "お名前・年齢・好きなものを、チャットで答えるだけ。" },
  { n: 2, title: "AIが5分で生成", desc: "物語とイラストを、AIが自動で作り上げます。" },
  { n: 3, title: "プレビュー → 購入", desc: "12ページを確認して、気に入ったら購入。" },
];

const samples = [
  { emoji: "🚀", title: "たろうの宇宙大冒険", tone: "from-[color:var(--sky)]/50 to-[color:var(--butter)]/50" },
  { emoji: "🦖", title: "はなこと恐竜の森", tone: "from-[color:var(--butter)]/60 to-[color:var(--coral)]/40" },
  { emoji: "🐟", title: "みなとの海のたんけん", tone: "from-[color:var(--sky)]/60 to-[color:var(--coral)]/30" },
  { emoji: "🌸", title: "さくらの魔法の国", tone: "from-[color:var(--coral)]/30 to-[color:var(--butter)]/60" },
  { emoji: "🎏", title: "けんとのお祭り物語", tone: "from-[color:var(--butter)]/50 to-[color:var(--sky)]/50" },
  { emoji: "🐻", title: "ゆいと森のなかまたち", tone: "from-[color:var(--coral)]/30 to-[color:var(--sky)]/50" },
];

const faqs = [
  { q: "AIが作った絵本の著作権は誰のものですか？", a: "生成された絵本の内容は、購入されたお客さまが個人利用の範囲で自由にお楽しみいただけます。詳細は利用規約をご確認ください。" },
  { q: "何歳の子供に向いていますか？", a: "3〜8歳のお子さま向けに設計していますが、年齢や興味に合わせて物語の内容を調整できます。" },
  { q: "何回作り直せますか？", a: "内容が気に入らない場合は、購入前であれば何度でも作り直していただけます。納得のいく1冊を作りましょう。" },
  { q: "データの安全性は？", a: "お子さまの情報は絵本の生成のみに使用し、暗号化して安全に管理します。第三者に提供することはありません。" },
];

// Reveal sections as they scroll into view (checkout.com-style entrance).
function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);
}

const rise = (delay: number) => ({ animationDelay: `${delay}ms`, animationFillMode: "both" as const });
const RISE = "animate-in fade-in slide-in-from-bottom-4 duration-700";

function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  useReveal();

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[color:var(--cream)] to-[#FFECEE]">
          {/* animated soft backdrop */}
          <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
            <div className="ds-blob absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[color:var(--coral)] opacity-20 blur-3xl" />
            <div className="ds-blob absolute top-10 right-0 h-80 w-80 rounded-full bg-[color:var(--sky)] opacity-25 blur-3xl" style={{ animationDelay: "-6s" }} />
            <div className="ds-blob absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[color:var(--butter)] opacity-30 blur-3xl" style={{ animationDelay: "-12s" }} />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-16 md:py-24 grid items-center gap-10 md:grid-cols-2">
            <div className="text-center md:text-left">
              <span className={`inline-flex items-center gap-2 rounded-full bg-white/80 border border-[color:var(--border)] px-4 py-1.5 text-xs font-semibold text-[color:var(--coral)] shadow-sm ${RISE}`} style={rise(0)}>
                🌸 AIパーソナライズ絵本
              </span>
              <h1 className="mt-6" style={{ fontFamily: "var(--font-display)" }}>
                <span className={`block text-4xl md:text-6xl leading-tight tracking-tight ${RISE}`} style={rise(90)}>
                  あなたのお子さまが
                </span>
                <span className={`block mt-1 text-2xl md:text-3xl leading-snug text-[color:var(--coral)] ${RISE}`} style={rise(180)}>
                  主人公の絵本
                </span>
              </h1>
              <p className={`mt-5 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-md mx-auto md:mx-0 ${RISE}`} style={rise(280)}>
                AIが12ページの世界にひとつだけの絵本を、たった5分で。
              </p>
              <div className={RISE} style={rise(380)}>
                <div className="mt-8">
                  <Link to="/create" className="btn-primary text-lg !px-8 !py-4 shadow-[var(--shadow-soft)] hover:shadow-lg">
                    絵本を作る →
                  </Link>
                </div>
                <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">🎁 クレジットカード不要でお試し</p>
              </div>
            </div>

            <div className={`${RISE}`} style={rise(240)}>
              <img
                src={heroArt}
                alt="家族で絵本を読む様子"
                className="ds-float w-full max-w-md mx-auto rounded-3xl shadow-[var(--shadow-soft)]"
              />
            </div>
          </div>
        </section>

        {/* ===== Features ===== */}
        <section className="mx-auto max-w-6xl px-4 py-16 reveal">
          <h2 className="text-2xl md:text-3xl text-center">なぜDreamStoriesが選ばれるのか</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="card-soft text-center transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-lg">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--butter)] text-3xl">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===== How it works ===== */}
        <section className="bg-white/50 border-y border-[color:var(--border)]">
          <div className="mx-auto max-w-6xl px-4 py-16 reveal">
            <h2 className="text-2xl md:text-3xl text-center">3ステップで完成</h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.n} className="relative text-center">
                  <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--coral)] text-white text-3xl font-bold shadow-[var(--shadow-soft)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm text-[color:var(--muted-foreground)] leading-relaxed max-w-xs mx-auto">{s.desc}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 -right-4 text-2xl text-[color:var(--coral)]/50">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Sample gallery (auto-scrolling marquee) ===== */}
        <section className="mx-auto max-w-6xl px-4 py-16 reveal">
          <h2 className="text-2xl md:text-3xl text-center">実際に生成された絵本</h2>
          <p className="mt-2 text-center text-sm text-[color:var(--muted-foreground)]">世界にひとつの絵本たち</p>
          <div className="mt-10 relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
            <div className="ds-marquee flex w-max gap-4">
              {[...samples, ...samples].map((s, i) => (
                <div key={i} className="w-44 shrink-0">
                  <div className="card-soft !p-3">
                    <div className={`aspect-[3/4] rounded-xl bg-gradient-to-br ${s.tone} flex items-center justify-center text-5xl`}>
                      {s.emoji}
                    </div>
                    <div className="mt-3 text-sm font-semibold text-center truncate">{s.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section className="mx-auto max-w-3xl px-4 py-16 reveal">
          <h2 className="text-2xl md:text-3xl text-center">よくあるご質問</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="card-soft !p-0 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold">{f.q}</span>
                  <span className="text-[color:var(--coral)] text-xl shrink-0 transition-transform duration-300" style={{ transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: openFaq === i ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 text-sm text-[color:var(--muted-foreground)] leading-relaxed">{f.a}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== CTA banner ===== */}
        <section className="mx-auto max-w-4xl px-4 pb-16 reveal">
          <div className="rounded-3xl bg-gradient-to-r from-[color:var(--coral)] to-[#ffb3a7] p-10 md:p-14 text-center text-white shadow-[var(--shadow-soft)]">
            <h2 className="text-2xl md:text-3xl text-white" style={{ fontFamily: "var(--font-display)" }}>
              あなたのお子さまの物語を、今すぐ始めよう
            </h2>
            <p className="mt-3 text-white/90 text-sm">3分の入力で、世界にひとつの絵本ができあがります。</p>
            <Link
              to="/create"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-white text-[color:var(--coral)] px-8 py-4 font-bold shadow-lg hover:-translate-y-0.5 transition"
            >
              絵本を作る →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
