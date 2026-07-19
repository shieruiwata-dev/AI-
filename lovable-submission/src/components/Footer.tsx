const columns = [
  {
    title: "サービス",
    links: ["絵本の作り方", "料金", "サンプル"],
  },
  {
    title: "会社情報",
    links: ["会社概要", "お問い合わせ", "採用情報"],
  },
  {
    title: "法的",
    links: ["利用規約", "プライバシーポリシー", "特定商取引法に基づく表記"],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[color:var(--border)] bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-2 md:grid-cols-4 text-sm text-[color:var(--muted-foreground)]">
        {/* Column 1: brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-base">✦</span>
            <span className="text-base font-bold text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>
              DreamStories
            </span>
          </div>
          <p className="mt-3 leading-relaxed">
            あなたのお子さまが主人公の、世界にひとつだけの絵本。AIが物語とイラストを紡ぎます。
          </p>
        </div>

        {/* Columns 2-4: link lists */}
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-2">
            <div className="font-bold text-[color:var(--foreground)]">{col.title}</div>
            {col.links.map((label) => (
              <a key={label} href="#" className="hover:text-[color:var(--coral)] transition-colors">
                {label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-[color:var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-[color:var(--muted-foreground)] text-center">
          © {new Date().getFullYear()} DreamStories Japan. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
