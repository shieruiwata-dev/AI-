import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

type Msg = { role: "ai" | "user"; text: string };

const questions = [
  "こんにちは！お子さまの絵本を作りましょう。まず、お子さまのお名前を教えてください。",
  "ありがとうございます！お子さまの年齢を教えてください。（例：5歳）",
  "素敵ですね。お子さまが好きなものや興味のあることを教えてください。（例：恐竜、電車、お姫さま）",
  "最後に、どんなテーマの絵本がいいですか？（例：冒険、友情、魔法）",
];

function CreatePage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([{ role: "ai", text: questions[0] }]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const value = input.trim();
    if (!value) return;
    const next: Msg[] = [...messages, { role: "user", text: value }];
    const nextStep = step + 1;
    if (nextStep < questions.length) {
      next.push({ role: "ai", text: questions[nextStep] });
      setMessages(next);
      setStep(nextStep);
    } else {
      next.push({ role: "ai", text: "ありがとうございます！絵本の作成を開始します..." });
      setMessages(next);
      setTimeout(() => navigate({ to: "/generating" }), 800);
    }
    setInput("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6 flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}>
              {m.role === "ai" && (
                <div className="mr-2 h-9 w-9 shrink-0 rounded-full bg-[color:var(--butter)] flex items-center justify-center">🧚</div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                m.role === "user"
                  ? "bg-[color:var(--coral)] text-white rounded-br-md"
                  : "bg-white border border-[color:var(--border)] rounded-bl-md"
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="sticky bottom-2 flex gap-2 bg-[color:var(--cream)]/90 backdrop-blur pt-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40"
          />
          <button type="submit" className="btn-primary !py-3 !px-5">送信</button>
        </form>
      </main>
    </div>
  );
}
