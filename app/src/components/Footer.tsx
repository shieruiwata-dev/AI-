export function Footer() {
  return (
    <footer className="mt-24 border-t border-[color:var(--border)] bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-3 text-sm text-[color:var(--muted-foreground)]">
        <div>
          <div className="text-base font-bold text-[color:var(--foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            DreamStories
          </div>
          <p className="mt-2">あなたのお子さまが主人公の、世界にひとつだけの絵本。</p>
        </div>
        <div className="flex flex-col gap-2">
          <a href="#" className="hover:text-[color:var(--foreground)]">利用規約</a>
          <a href="#" className="hover:text-[color:var(--foreground)]">プライバシーポリシー</a>
          <a href="#" className="hover:text-[color:var(--foreground)]">お問い合わせ</a>
        </div>
        <div className="md:text-right">© {new Date().getFullYear()} DreamStories</div>
      </div>
    </footer>
  );
}
