import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { BookCover } from "@/components/BookCover";
import { FlipBook } from "@/components/FlipBook";
import {
  saveExtractedParams,
  generateStory,
  regeneratePage,
  requestAdjustment,
  updateBookTitle,
  type GenerateProgress,
  type GenerateStoryResponse,
} from "@/lib/api";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

type Msg = { role: "ai" | "user"; text: string };
type Phase = "chat" | "generating" | "ready";

const THEMES = [
  { emoji: "🚀", label: "宇宙冒険" },
  { emoji: "🦖", label: "恐竜の世界" },
  { emoji: "🐟", label: "海の探検" },
  { emoji: "🌲", label: "魔法の森" },
  { emoji: "🎋", label: "お祭り冒険" },
];
const TOTAL = 4;

const STAGE_TEXT: Record<GenerateProgress["stage"], string> = {
  imagining: "お子さまの世界を想像しています…",
  story_generation: "物語を書いています…",
  image_generation: "イラストを描いています…",
  finalize: "絵本を仕上げています…",
};

function CreatePage() {
  // ---- chat state ----
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"text" | "theme" | "locked" | "adjust">("text");
  const [input, setInput] = useState("");
  const data = useRef({ name: "", age: "", interests: "", themeEmoji: "" });

  // ---- studio state ----
  const [phase, setPhase] = useState<Phase>("chat");
  const [tab, setTab] = useState<"chat" | "book">("chat"); // mobile tabs
  const [progress, setProgress] = useState<GenerateProgress>({ percent: 0, stage: "imagining" });
  const [book, setBook] = useState<GenerateStoryResponse | null>(null);
  const [page, setPage] = useState(0);
  const [regenBusy, setRegenBusy] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const t = timers.current;
    return () => {
      t.forEach(clearTimeout);
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const pushAi = (text: string) => setMessages((m) => [...m, { role: "ai", text }]);
  const pushUser = (text: string) => setMessages((m) => [...m, { role: "user", text }]);

  const aiSay = (text: string, after?: () => void) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      pushAi(text);
      after?.();
    }, 900);
    timers.current.push(t);
  };

  // Kick off the conversation.
  useEffect(() => {
    aiSay("DreamStoriesへようこそ！お子さまの絵本を作りましょう。まず、お子さまのお名前を教えてください。");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- onboarding flow ----
  const sendText = () => {
    const v = input.trim();
    if (!v || typing) return;
    if (mode === "adjust") { sendAdjust(v); return; }
    if (mode !== "text") return;
    pushUser(v);
    setInput("");
    if (step === 0) {
      data.current.name = v;
      setStep(1);
      aiSay(`${v}ちゃんですね！おいくつですか？`);
    } else if (step === 1) {
      data.current.age = v;
      setStep(2);
      aiSay(`${data.current.name}ちゃんは${v}歳ですね。普段、どんなことが好きですか？`);
    } else if (step === 2) {
      data.current.interests = v;
      setStep(3);
      aiSay("素敵ですね！以下のテーマから選んでいただけますか？", () => setMode("theme"));
    }
  };

  const chooseTheme = (theme: { emoji: string; label: string }) => {
    if (mode !== "theme" || typing) return;
    pushUser(`${theme.emoji} ${theme.label}`);
    data.current.themeEmoji = theme.emoji;
    setMode("locked");
    // 資料Week5の仕様どおり、収集値をSessionStorageへ（generate-storyに渡す）
    saveExtractedParams({
      child_name: data.current.name,
      age: Number.parseInt(data.current.age, 10) || data.current.age,
      interests: data.current.interests,
      theme: theme.label,
      language: "ja",
    });
    aiSay(
      `ありがとうございます！${data.current.name}ちゃんの${theme.label}の絵本を作りますね。右の画面で様子が見られます📖`,
      startGeneration,
    );
  };

  // ---- generation (right pane) ----
  const startGeneration = () => {
    setPhase("generating");
    setTab("book");
    const ac = new AbortController();
    abortRef.current = ac;
    // WEEK5: generateStoryの中身をEdge Function呼び出しに差し替えるだけ（api.ts参照）
    generateStory(
      {
        child_name: data.current.name,
        age: Number.parseInt(data.current.age, 10) || data.current.age,
        interests: data.current.interests,
        theme: THEMES.find((t) => t.emoji === data.current.themeEmoji)?.label ?? "",
        language: "ja",
      },
      setProgress,
      ac.signal,
    )
      .then((b) => {
        setBook(b);
        setTitleDraft(b.title);
        setPage(0);
        setPhase("ready");
        setMode("adjust");
        setTab("book");
        aiSay(
          "できあがりました！🎉 右のプレビューでページをめくってみてください。気になるページは「描き直す」ボタンで作り直せます。チャットで「もっと明るいお話にして」のような調整指示もできますよ。",
        );
      })
      .catch((e: unknown) => {
        if ((e as DOMException)?.name === "AbortError") return;
        console.error(e);
      });
  };

  // ---- adjustments (mock; api.ts経由でWeek 5にDify接続) ----
  const sendAdjust = async (v: string) => {
    pushUser(v);
    setInput("");
    setTyping(true);
    const res = await requestAdjustment(book?.book_id ?? "demo", v);
    setTyping(false);
    pushAi(res.answer);
  };

  const regen = async () => {
    if (!book || regenBusy) return;
    const n = page + 1;
    setRegenBusy(true);
    const next = await regeneratePage(book.book_id, n);
    setBook({ ...book, pages: book.pages.map((p, i) => (i === page ? next : p)) });
    setRegenBusy(false);
    pushAi(`${n}ページ目を描き直しました✨ ほかのページも気になったら教えてください。`);
  };

  const saveTitle = async () => {
    if (!book) return;
    const t = titleDraft.trim() || book.title;
    await updateBookTitle(book.book_id, t);
    setBook({ ...book, title: t });
    setEditingTitle(false);
  };

  const progressCount = Math.min(step + 1, TOTAL);
  const placeholders = ["お名前を入力...", "年齢を入力...", "好きなものを入力..."];
  const inputPlaceholder =
    mode === "adjust" ? "調整したいことを入力（例：もっと明るいお話にして）" : (placeholders[step] ?? "メッセージを入力...");
  const inputDisabled = typing || mode === "theme" || mode === "locked";

  // ring geometry (generating pane)
  const R = 82;
  const C = 2 * Math.PI * R;

  return (
    <div className="h-dvh flex flex-col bg-[color:var(--cream)]">
      {/* Simple header: back + logo */}
      <header className="shrink-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
          <Link to="/" className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" aria-label="戻る">←</Link>
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-base">✦</span>
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>DreamStories</span>
          </Link>
          {/* mobile tabs */}
          <div className="ml-auto flex md:hidden rounded-full border border-[color:var(--border)] bg-white p-0.5 text-sm">
            <button
              onClick={() => setTab("chat")}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap ${tab === "chat" ? "bg-[color:var(--coral)] text-white font-bold" : "text-[color:var(--muted-foreground)]"}`}
            >
              💬 チャット
            </button>
            <button
              onClick={() => setTab("book")}
              className={`relative px-3 py-1.5 rounded-full whitespace-nowrap ${tab === "book" ? "bg-[color:var(--coral)] text-white font-bold" : "text-[color:var(--muted-foreground)]"}`}
            >
              📖 えほん
              {phase !== "chat" && tab === "chat" && (
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[color:var(--coral)] ring-2 ring-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Studio: left chat / right live preview */}
      <main className="flex-1 min-h-0 mx-auto w-full max-w-6xl px-4 py-4 md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-5">
        {/* ==== Left: chat ==== */}
        <section className={`${tab === "book" ? "hidden md:flex" : "flex"} h-full min-h-0 flex-col`}>
          {/* progress indicator (onboarding only) */}
          {phase === "chat" && (
            <div className="shrink-0 pb-3">
              <div className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)] mb-1.5">
                <span>お子さまについて教えてください</span>
                <span className="font-semibold text-[color:var(--coral)] tabular-nums">{progressCount} / {TOTAL}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[color:var(--muted)] overflow-hidden">
                <div className="h-full rounded-full bg-[color:var(--coral)] transition-all duration-500" style={{ width: `${(progressCount / TOTAL) * 100}%` }} />
              </div>
            </div>
          )}

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-3 pb-3 pr-1">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                {m.role === "ai" && (
                  <div className="mr-2 h-9 w-9 shrink-0 rounded-full bg-[color:var(--butter)] flex items-center justify-center">🧚</div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${m.role === "user" ? "bg-[color:var(--sky)] text-[#1F3A47] rounded-br-md" : "bg-[#FFE9EA] text-[#5B4145] rounded-bl-md"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="mr-2 h-9 w-9 shrink-0 rounded-full bg-[color:var(--butter)] flex items-center justify-center">🧚</div>
                <div className="rounded-2xl rounded-bl-md bg-[#FFE9EA] text-[color:var(--coral)] px-4 py-4 shadow-sm flex items-center gap-1.5">
                  <span className="ds-dot" />
                  <span className="ds-dot" style={{ animationDelay: "0.2s" }} />
                  <span className="ds-dot" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
          </div>

          {/* input / theme buttons */}
          <div className="shrink-0 pt-2 bg-[color:var(--cream)]">
            {mode === "theme" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => chooseTheme(t)}
                    disabled={typing}
                    className="rounded-2xl border-2 border-[color:var(--coral)] bg-white px-3 py-3 text-sm font-semibold text-[color:var(--coral)] hover:bg-[color:var(--coral)] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <span className="text-lg mr-1">{t.emoji}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            ) : mode === "locked" ? (
              <div className="text-center text-sm text-[color:var(--muted-foreground)] py-3">絵本を生成しています…</div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); sendText(); }} className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={inputPlaceholder}
                  inputMode={step === 1 && mode === "text" ? "numeric" : "text"}
                  disabled={inputDisabled}
                  className="flex-1 min-w-0 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40 disabled:opacity-60"
                />
                <button type="submit" disabled={inputDisabled || !input.trim()} className="btn-primary !py-3 !px-5 disabled:opacity-50">送信</button>
              </form>
            )}
          </div>
        </section>

        {/* ==== Right: live book pane ==== */}
        <section className={`${tab === "chat" ? "hidden md:flex" : "flex"} h-full min-h-0 flex-col mt-4 md:mt-0`}>
          <div className="relative flex-1 min-h-0 overflow-y-auto rounded-3xl border border-[color:var(--border)] bg-gradient-to-b from-white/80 to-[#FFF1EC] p-4 md:p-6">
            {/* atmospheric backdrop (same language as the hero) */}
            <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden="true">
              <div className="ds-blob absolute -top-16 -left-10 h-56 w-56 rounded-full bg-[color:var(--sky)] opacity-20 blur-3xl" />
              <div className="ds-blob absolute bottom-0 -right-10 h-64 w-64 rounded-full bg-[color:var(--coral)] opacity-15 blur-3xl" style={{ animationDelay: "-8s" }} />
            </div>
            {phase === "chat" && (
              // ① 回答中：下書きカードが埋まっていく
              <div className="relative h-full flex flex-col items-center justify-center text-center gap-5">
                <div className="ds-float w-40 md:w-48 drop-shadow-xl">
                  <BookCover
                    key={data.current.themeEmoji || "blank"}
                    emoji={data.current.themeEmoji || "📖"}
                    tone="from-[color:var(--sky)] to-[color:var(--butter)]"
                    size="text-5xl"
                    className={`animate-in fade-in zoom-in-95 duration-500 ${data.current.themeEmoji ? "" : "opacity-70 grayscale-[30%]"}`}
                  />
                </div>
                {data.current.name && (
                  <p key={data.current.name} className="animate-in fade-in zoom-in-95 duration-500 text-lg" style={{ fontFamily: "var(--font-display)" }}>
                    {data.current.name}ちゃんの えほん
                  </p>
                )}
                <div className="w-full max-w-xs text-left text-sm space-y-2">
                  {[
                    { label: "おなまえ", value: data.current.name },
                    { label: "ねんれい", value: data.current.age && `${data.current.age}歳` },
                    { label: "すきなもの", value: data.current.interests },
                    { label: "テーマ", value: data.current.themeEmoji && `${data.current.themeEmoji} ${THEMES.find((t) => t.emoji === data.current.themeEmoji)?.label ?? ""}` },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-xl bg-white border border-[color:var(--border)] px-4 py-2.5">
                      <span className="text-xs text-[color:var(--muted-foreground)]">{row.label}</span>
                      {row.value ? (
                        <span className="font-semibold animate-in fade-in duration-500">{row.value}</span>
                      ) : (
                        <span className="text-[color:var(--border)]">…</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {step < 3 ? `あと${4 - step}つ答えると、絵本づくりが始まります` : "テーマを選ぶと、絵本づくりが始まります"}
                </p>
              </div>
            )}

            {phase === "generating" && (
              // ② 生成中：進捗リング＋星の舞い（/generating画面と同じ演出）
              <div className="relative h-full flex flex-col items-center justify-center text-center gap-5 overflow-hidden">
                <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                  {[
                    { e: "⭐", l: "10%", d: "0s", s: "7s" },
                    { e: "💗", l: "26%", d: "2.4s", s: "8s" },
                    { e: "✨", l: "44%", d: "1.2s", s: "6.5s" },
                    { e: "🌟", l: "62%", d: "3.1s", s: "7.5s" },
                    { e: "💗", l: "78%", d: "0.6s", s: "8.5s" },
                    { e: "🌙", l: "90%", d: "1.8s", s: "9s" },
                  ].map((s, i) => (
                    <span key={i} className="ds-rise absolute bottom-8 text-base" style={{ left: s.l, ["--rspeed" as string]: s.s, animationDelay: s.d }}>
                      {s.e}
                    </span>
                  ))}
                </div>
                <div className="relative h-48 w-48">
                  <svg viewBox="0 0 200 200" className="h-48 w-48 -rotate-90">
                    <defs>
                      <linearGradient id="studioRing" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#FF9AA2" />
                        <stop offset="0.6" stopColor="#FFB3A7" />
                        <stop offset="1" stopColor="#FFE5A0" />
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r={R} fill="none" stroke="var(--muted)" strokeWidth="14" />
                    <circle cx="100" cy="100" r={R} fill="none" stroke="url(#studioRing)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress.percent / 100)} style={{ transition: "stroke-dashoffset 0.25s ease" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-[color:var(--coral)] tabular-nums leading-none" style={{ fontFamily: "var(--font-display)" }}>
                      {progress.percent}
                      <span className="text-xl align-top">%</span>
                    </span>
                    <span className="mt-1 text-xs text-[color:var(--muted-foreground)]">生成中</span>
                  </div>
                </div>
                <div className="h-7">
                  <p key={progress.stage} className="animate-in fade-in duration-500 text-lg font-semibold">{STAGE_TEXT[progress.stage]}</p>
                </div>
                <p className="text-xs text-[color:var(--muted-foreground)]">できあがると、ここに絵本があらわれます</p>
              </div>
            )}

            {phase === "ready" && book && (
              // ③ 完成：本格3Dめくりプレビュー＋調整
              <div className="relative flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* title row (editable) */}
                <div className="flex items-center justify-center gap-2">
                  {editingTitle ? (
                    <form onSubmit={(e) => { e.preventDefault(); saveTitle(); }} className="flex gap-2 w-full max-w-sm">
                      <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} autoFocus className="flex-1 min-w-0 rounded-xl border border-[color:var(--coral)] bg-white px-3 py-2 text-sm outline-none" />
                      <button type="submit" className="btn-primary !py-2 !px-4 text-sm">保存</button>
                    </form>
                  ) : (
                    <>
                      <h2 className="text-lg truncate" style={{ fontFamily: "var(--font-display)" }}>{book.title}</h2>
                      <button onClick={() => { setTitleDraft(book.title); setEditingTitle(true); }} aria-label="タイトルを編集" className="h-8 w-8 shrink-0 rounded-full border border-[color:var(--border)] bg-white text-sm">✏️</button>
                    </>
                  )}
                </div>

                {/* 本物のようにめくれるプレビュー（/previewと同じFlipBook） */}
                <div className="px-3 md:px-5">
                  <FlipBook pages={book.pages} per={1} onIndexChange={setPage} />
                </div>

                {/* regen */}
                <div className="flex justify-center">
                  <button onClick={regen} disabled={regenBusy} className="rounded-full border-2 border-[color:var(--coral)] bg-white px-5 py-2 text-xs font-bold text-[color:var(--coral)] hover:bg-[color:var(--coral)] hover:text-white transition-colors disabled:opacity-50">
                    {regenBusy ? "描き直しています…" : "🔄 このページを描き直す"}
                  </button>
                </div>

                {/* actions */}
                <div className="mt-1 space-y-2">
                  <Link to="/checkout/$id" params={{ id: book.book_id }} className="ds-shimmer btn-primary w-full text-base !py-3.5">
                    この絵本を購入する（5,000円）
                  </Link>
                  <Link to="/preview/$id" params={{ id: book.book_id }} className="block text-center text-xs text-[color:var(--muted-foreground)] underline underline-offset-2">
                    ⛶ 大きなプレビューでめくって見る
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
