import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { saveExtractedParams } from "@/lib/api";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

type Msg = { role: "ai" | "user"; text: string };

const THEMES = [
  { emoji: "🚀", label: "宇宙冒険" },
  { emoji: "🦖", label: "恐竜の世界" },
  { emoji: "🐟", label: "海の探検" },
  { emoji: "🌲", label: "魔法の森" },
  { emoji: "🎋", label: "お祭り冒険" },
];

// step: which answer we're waiting for. 0=name 1=age 2=interests 3=theme
const TOTAL = 4;

function CreatePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"text" | "theme" | "done">("text");
  const [input, setInput] = useState("");
  const data = useRef({ name: "", age: "", interests: "" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // AI "types" for a beat, then the message appears; optional callback after.
  const aiSay = (text: string, after?: () => void) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { role: "ai", text }]);
      after?.();
    }, 900);
    timers.current.push(t);
  };

  // Kick off the conversation.
  useEffect(() => {
    aiSay(
      "DreamStoriesへようこそ！お子さまの絵本を作りましょう。まず、お子さまのお名前を教えてください。",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pushUser = (text: string) => setMessages((m) => [...m, { role: "user", text }]);

  const sendText = () => {
    const v = input.trim();
    if (!v || mode !== "text" || typing) return;
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
    setMode("done");
    // 資料Week5の仕様どおり、収集した回答をSessionStorageへ保存。
    // 生成中画面（/generating）がここから読み出して generate-story に渡す。
    // WEEK5: この台本対話をapi.difyChat()に差し替えたら、レスポンスの
    //        extracted_params をそのまま保存する形になる。
    saveExtractedParams({
      child_name: data.current.name,
      age: Number.parseInt(data.current.age, 10) || data.current.age,
      interests: data.current.interests,
      theme: theme.label,
      language: "ja",
    });
    aiSay(
      `ありがとうございます！${data.current.name}ちゃんの${theme.label}の絵本を作りますね。生成を開始します...`,
      () => {
        const t = setTimeout(() => navigate({ to: "/generating" }), 3000);
        timers.current.push(t);
      },
    );
  };

  const progress = Math.min(step + 1, TOTAL);
  const placeholders = ["お名前を入力...", "年齢を入力...", "好きなものを入力..."];

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--cream)]">
      {/* Simple header: back + logo only */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]"
            aria-label="戻る"
          >
            ←
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-base">✦</span>
            <span className="text-base font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              DreamStories
            </span>
          </Link>
        </div>
      </header>

      {/* Progress indicator */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-3">
        <div className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)] mb-1.5">
          <span>お子さまについて教えてください</span>
          <span className="font-semibold text-[color:var(--coral)] tabular-nums">{progress} / {TOTAL}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[color:var(--muted)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[color:var(--coral)] transition-all duration-500"
            style={{ width: `${(progress / TOTAL) * 100}%` }}
          />
        </div>
      </div>

      {/* Chat */}
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-4 flex flex-col min-h-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {m.role === "ai" && (
                <div className="mr-2 h-9 w-9 shrink-0 rounded-full bg-[color:var(--butter)] flex items-center justify-center">🧚</div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-[color:var(--sky)] text-[#1F3A47] rounded-br-md"
                    : "bg-[#FFE9EA] text-[#5B4145] rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
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

        {/* Bottom fixed: theme buttons OR text input */}
        <div className="sticky bottom-2 bg-[color:var(--cream)]/90 backdrop-blur pt-2">
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
          ) : mode === "text" ? (
            <form onSubmit={(e) => { e.preventDefault(); sendText(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders[step] ?? "メッセージを入力..."}
                inputMode={step === 1 ? "numeric" : "text"}
                disabled={typing}
                autoFocus
                className="flex-1 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40 disabled:opacity-60"
              />
              <button type="submit" disabled={typing || !input.trim()} className="btn-primary !py-3 !px-5 disabled:opacity-50">
                送信
              </button>
            </form>
          ) : (
            <div className="text-center text-sm text-[color:var(--muted-foreground)] py-3">
              絵本の生成を開始しています...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
