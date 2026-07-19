import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const features = [
  {
    icon: "✨",
    title: "AIが物語を作る",
    desc: "お子さまの名前・年齢・興味から、AIがオリジナルの物語を紡ぎます。",
    tintBg: "color-mix(in oklab, var(--coral) 8%, white)",
    badgeBg: "color-mix(in oklab, var(--coral) 22%, white)",
    borderColor: "color-mix(in oklab, var(--coral) 35%, white)",
  },
  {
    icon: "🎨",
    title: "12ページのフルカラー",
    desc: "美しいイラストと共に、12ページの絵本をお届けします。",
    tintBg: "color-mix(in oklab, var(--sky) 12%, white)",
    badgeBg: "color-mix(in oklab, var(--sky) 28%, white)",
    borderColor: "color-mix(in oklab, var(--sky) 40%, white)",
  },
  {
    icon: "🎏",
    title: "日本文化がいっぱい",
    desc: "四季や祭り、日本ならではの風景が物語を彩ります。",
    tintBg: "color-mix(in oklab, var(--butter) 20%, white)",
    badgeBg: "color-mix(in oklab, var(--butter) 45%, white)",
    borderColor: "color-mix(in oklab, var(--butter) 55%, white)",
  },
];

const faqs = [
  { q: "どんな絵本ができますか？", a: "12ページのフルカラー絵本で、お子さまが主人公として登場します。" },
  { q: "何歳向けですか？", a: "3〜8歳のお子さま向けに設計されていますが、年齢に合わせて内容を調整できます。" },
  { q: "配送はありますか？", a: "現在はデジタル版のみのご提供です。今後、印刷版もご用意予定です。" },
  { q: "支払い方法は？", a: "クレジットカードでのお支払いに対応しています。" },
];

function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <div className="min-h-screen overflow-x-hidden pb-20 md:pb-0">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-[color:var(--coral)] opacity-10 blur-3xl" />
            <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-[color:var(--sky)] opacity-15 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[color:var(--butter)] opacity-20 blur-3xl" />
          </div>
          <div className="mx-auto max-w-6xl px-4 pt-10 pb-12 md:pt-20 md:pb-24 grid md:grid-cols-2 gap-10 md:gap-8 items-center">
            {/* Text column */}
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-[color:var(--border)] px-4 py-1.5 text-xs font-semibold text-[color:var(--coral)] shadow-sm">
                🌸 3〜8歳向け・世界にひとつの絵本
              </span>
              <h1 className="mt-5 text-3xl md:text-5xl lg:text-6xl leading-tight tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                あなたのお子さまが<br className="md:hidden" />
                <span className="text-[color:var(--coral)]">主人公の絵本</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-[color:var(--muted-foreground)] max-w-xl mx-auto md:mx-0">
                AIが12ページの世界にひとつだけの絵本を作ります。
              </p>
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)] max-w-xl mx-auto md:mx-0">
                入力は3分・生成されるまで料金はかかりません
              </p>

              <div className="mt-8 flex flex-col items-center md:items-start">
                <Link
                  to="/create"
                  className="btn-primary w-full md:w-auto text-lg !py-4 !px-8 min-h-14"
                >
                  絵本を作る →
                </Link>
                <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">
                  🎁 クレジットカード不要でお試し
                </p>
                <a
                  href="#sample"
                  className="mt-4 text-sm underline underline-offset-4 text-[color:var(--muted-foreground)] hover:text-[color:var(--coral)] transition"
                >
                  サンプルを見る
                </a>
              </div>
            </div>

            {/* Visual column: open book */}
            <div className="relative mx-auto w-full max-w-sm md:max-w-none">
              {/* Floating decorations */}
              <span className="absolute -top-4 -left-2 text-2xl opacity-60 select-none">⭐</span>
              <span className="absolute top-6 -right-2 text-xl opacity-50 select-none">💗</span>
              <span className="absolute -bottom-3 left-8 text-xl opacity-50 select-none">⭐</span>
              <span className="absolute bottom-10 -right-4 text-2xl opacity-60 select-none">💗</span>

              <div
                className="relative mx-auto rounded-2xl bg-white border border-[color:var(--border)] p-3 md:p-4"
                style={{
                  boxShadow: "var(--shadow-soft)",
                  transform: "rotate(-2deg)",
                }}
              >
                <div className="grid grid-cols-2 rounded-xl overflow-hidden">
                  {/* Left page */}
                  <div
                    className="aspect-[3/4] flex items-center justify-center text-7xl md:text-8xl border-r border-dashed border-[color:var(--border)]"
                    style={{ backgroundColor: "color-mix(in oklab, var(--sky) 18%, white)" }}
                  >
                    🚀
                  </div>
                  {/* Right page */}
                  <div
                    className="aspect-[3/4] flex items-center justify-center p-4 text-center"
                    style={{ backgroundColor: "color-mix(in oklab, var(--butter) 25%, white)" }}
                  >
                    <p
                      className="text-xl md:text-2xl leading-snug text-[color:var(--foreground)]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      たろうくんの<br />ぼうけん
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-5 md:grid-cols-3 items-stretch">
            {features.map((f) => (
              <div
                key={f.title}
                className="card-soft text-center h-full flex flex-col transition-transform duration-150 hover:-translate-y-1"
                style={{
                  backgroundColor: f.tintBg,
                  borderColor: f.borderColor,
                }}
              >
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-3xl"
                  style={{ backgroundColor: f.badgeBg }}
                >
                  {f.icon}
                </div>
                <h3 className="mt-4 text-lg" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sample Gallery */}
        <section id="sample" className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-2xl md:text-3xl text-center">サンプルギャラリー</h2>
          <p className="mt-2 text-center text-sm text-[color:var(--muted-foreground)]">実際に作成された絵本の一部をご覧いただけます</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-[color:var(--sky)]/50 via-[color:var(--butter)]/50 to-[color:var(--coral)]/40 border border-[color:var(--border)] flex items-center justify-center text-4xl shadow-sm">
                {["🐻","🌸","🐰","🚂","🌈","🦊","⭐","🎈"][i-1]}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl md:text-3xl text-center">よくあるご質問</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="card-soft !p-0 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                >
                  <span className="font-semibold">{f.q}</span>
                  <span className="text-[color:var(--coral)] text-xl">{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-[color:var(--muted-foreground)]">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-4 pb-16">
          <div className="rounded-3xl bg-gradient-to-r from-[color:var(--coral)] to-[#ffb3a7] p-10 text-center text-white shadow-[var(--shadow-soft)]">
            <h2 className="text-2xl md:text-3xl text-white" style={{ fontFamily: "var(--font-display)" }}>今すぐ絵本を作ってみよう</h2>
            <p className="mt-2 text-white/90 text-sm">3分の入力で、世界にひとつの絵本ができあがります。</p>
            <Link to="/create" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white text-[color:var(--coral)] px-7 py-4 font-bold shadow-lg hover:-translate-y-0.5 transition">
              絵本を作る →
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      {/* Mobile sticky CTA */}
      <div
        className="md:hidden fixed left-0 right-0 bottom-0 z-50 bg-white border-t border-[color:var(--border)] px-4 pt-3"
        style={{
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          boxShadow: "0 -8px 24px -12px rgba(51,51,51,0.15)",
        }}
      >
        <Link to="/create" className="btn-primary w-full text-base min-h-14">
          絵本を作る →
        </Link>
      </div>
    </div>
  );
}
