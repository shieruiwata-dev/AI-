import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Toast } from "@/components/Toast";

export const Route = createFileRoute("/checkout/$id")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handlePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast("購入が完了しました！");
      setTimeout(() => navigate({ to: "/mypage" }), 1200);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* Book preview */}
        <div className="card-soft">
          <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-[color:var(--sky)]/40 via-[color:var(--butter)]/50 to-[color:var(--coral)]/40 flex items-center justify-center text-7xl">
            📖
          </div>
          <h2 className="mt-4 text-lg">ゆうきくんの森の冒険</h2>
          <p className="text-sm text-[color:var(--muted-foreground)]">全12ページ / デジタル版</p>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm text-[color:var(--muted-foreground)]">価格</span>
            <span className="text-2xl font-bold text-[color:var(--coral)]">¥5,000</span>
          </div>
        </div>

        {/* Payment form */}
        <form onSubmit={handlePurchase} className="card-soft">
          <h1 className="text-xl">お支払い情報</h1>
          <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">Stripeによる安全な決済（後で統合されます）</p>

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-xs font-semibold">メールアドレス</label>
              <input type="email" required placeholder="you@example.com" className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" />
            </div>
            <div>
              <label className="text-xs font-semibold">カード番号</label>
              <input required placeholder="1234 5678 9012 3456" className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">有効期限</label>
                <input required placeholder="MM / YY" className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" />
              </div>
              <div>
                <label className="text-xs font-semibold">CVC</label>
                <input required placeholder="123" className="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" />
              </div>
            </div>
          </div>

          <button disabled={loading} className="btn-primary mt-6 w-full text-base disabled:opacity-60">
            {loading ? "処理中..." : "¥5,000を支払って購入する"}
          </button>
          <p className="mt-3 text-[11px] text-center text-[color:var(--muted-foreground)]">絵本ID: {id}</p>
        </form>
      </main>
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  );
}
