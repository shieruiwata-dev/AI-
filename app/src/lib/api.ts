// ---------------------------------------------------------------------------
// API窓口（Week 5〜7 でここだけ本物に差し替える）
//
// 資料第8章の合意インタフェースどおりの型・関数シグネチャで定義してあります。
// いまは全関数がモック（ダミー）実装で、画面の挙動はこれまでと同じです。
//
// Week 5（柴崎さんとペア作業）でやること：
//   1. API_BASE に Edge Function のベースURLを設定
//      例) https://[プロジェクト].supabase.co/functions/v1
//   2. 各関数の「MOCK」ブロックを fetch() に置き換える
// UI側（各画面）はこのファイルしか見ていないので、画面の修正は不要です。
// ---------------------------------------------------------------------------

export const API_BASE = ""; // WEEK5: 柴崎さんから受け取るEdge FunctionのURLを設定

// ===== 型（資料第8章のJSON仕様と同じ形） =====

export type ExtractedParams = {
  child_name: string;
  age: number | string;
  interests: string;
  theme: string;
  language: string; // "ja"
};

export type DifyChatRequest = {
  message: string;
  conversation_id: string | null; // 初回はnull、以降レスポンスの値を使う
};

export type DifyChatResponse = {
  answer: string;
  conversation_id: string;
  is_complete: boolean;
  extracted_params?: ExtractedParams; // is_complete=true のときのみ
};

export type BookPage = {
  page_number: number;
  text: string;
  image_url: string;
};

export type GenerateStoryResponse = {
  success: boolean;
  book_id: string;
  title: string;
  pages: BookPage[];
  error?: string;
};

export type GenerateProgress = {
  percent: number; // 0-100
  stage: "imagining" | "story_generation" | "image_generation" | "finalize";
};

export type LibraryBook = {
  id: string;
  title: string;
  status: "generating" | "completed" | "paid" | "failed"; // booksテーブルのstatusと同じ（DB仕様書準拠）
  created_at: string;
  cover_emoji: string;
  cover_tone: string;
};

// ===== SessionStorage（資料 Week5 Day2-3 の指定どおり） =====

const PARAMS_KEY = "ds:extracted_params";
const BOOK_KEY = (id: string) => `ds:book:${id}`;

// 年齢入力の正規化：全角数字や「5歳」「５さい」等から整数を取り出す。
// booksテーブルの age は int NOT NULL のため、数値化できるものは必ず数値にする。
export function normalizeAge(v: number | string): number | string {
  if (typeof v === "number") return v;
  const half = v.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const m = half.match(/\d+/);
  return m ? Number(m[0]) : v;
}

export function saveExtractedParams(p: ExtractedParams) {
  try { sessionStorage.setItem(PARAMS_KEY, JSON.stringify(p)); } catch { /* private mode等 */ }
}

export function loadExtractedParams(): ExtractedParams | null {
  try {
    const raw = sessionStorage.getItem(PARAMS_KEY);
    return raw ? (JSON.parse(raw) as ExtractedParams) : null;
  } catch { return null; }
}

// ===== モック用データ =====

const placeholderImage = (n: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#FFE5A0"/><text x="300" y="215" font-family="sans-serif" font-size="42" fill="#333333" text-anchor="middle">Page ${n}</text></svg>`,
  )}`;

const mockTexts = (name: string) => [
  `むかしむかし、${name}は、ふしぎな もりへ でかけました。`,
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
  `${name}の ぼうけんは、まだまだ つづきます。`,
];

function mockBook(params: ExtractedParams | null): GenerateStoryResponse {
  const name = params?.child_name ? `${params.child_name}` : "たろう";
  const theme = params?.theme ?? "ぼうけん";
  return {
    success: true,
    book_id: "demo",
    title: `${name}くんの ${theme}`,
    pages: mockTexts(`${name}くん`).map((text, i) => ({
      page_number: i + 1,
      text,
      image_url: placeholderImage(i + 1),
    })),
  };
}

// ===== API関数（Week 5〜7 でMOCKブロックをfetchに差し替え） =====

/**
 * オンボードチャット（Edge Function: dify-chat）
 * チャット画面(create.tsx)はすでにこの関数経由で対話しています。
 * WEEK5: 下のMOCKブロックを
 *   const r = await fetch(`${API_BASE}/dify-chat`, {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", Authorization: `Bearer ${ログイントークン}` },
 *     body: JSON.stringify(req),
 *   });
 *   return await r.json();
 * に置き換えるだけ。画面側の修正は不要です。
 */
type MockChatState = { step: number; name?: string; age?: string; interests?: string };
const encodeChatState = (s: MockChatState) => "mock:" + btoa(unescape(encodeURIComponent(JSON.stringify(s))));
const decodeChatState = (id: string | null): MockChatState => {
  if (!id || !id.startsWith("mock:")) return { step: 0 };
  try { return JSON.parse(decodeURIComponent(escape(atob(id.slice(5))))) as MockChatState; } catch { return { step: 0 }; }
};

export async function difyChat(req: DifyChatRequest): Promise<DifyChatResponse> {
  // --- MOCK: Difyチャットフローの代役（台本対話）。会話状態はconversation_idに載せて往復 ---
  await new Promise((r) => setTimeout(r, 900)); // タイピング演出の間
  const st = decodeChatState(req.conversation_id);
  const msg = req.message.trim();
  if (st.step === 0) {
    return {
      answer: `${msg}ちゃんですね！おいくつですか？`,
      conversation_id: encodeChatState({ step: 1, name: msg }),
      is_complete: false,
    };
  }
  if (st.step === 1) {
    return {
      answer: `${st.name}ちゃんは${msg}歳ですね。普段、どんなことが好きですか？`,
      conversation_id: encodeChatState({ ...st, step: 2, age: msg }),
      is_complete: false,
    };
  }
  if (st.step === 2) {
    return {
      answer: "素敵ですね！以下のテーマから選んでいただけますか？",
      conversation_id: encodeChatState({ ...st, step: 3, interests: msg }),
      is_complete: false,
    };
  }
  // step 3: テーマ（例：「🚀 宇宙冒険」）→ 対話完了、収集パラメータを返す
  const theme = msg.split(/\s+/).pop() ?? msg;
  return {
    answer: `ありがとうございます！${st.name}ちゃんの${theme}の絵本を作りますね。右の画面で様子が見られます📖`,
    conversation_id: req.conversation_id ?? "",
    is_complete: true,
    extracted_params: {
      child_name: st.name ?? "",
      age: normalizeAge(st.age ?? ""),
      interests: st.interests ?? "",
      theme,
      language: "ja",
    },
  };
}

/**
 * 絵本生成（Edge Function: generate-story）
 * WEEK5: POST `${API_BASE}/generate-story`。Difyのストリーミング応答の
 * stage（story_generation / image_generation / finalize）を onProgress に流す。
 */
export function generateStory(
  params: ExtractedParams | null,
  onProgress?: (p: GenerateProgress) => void,
  signal?: AbortSignal,
): Promise<GenerateStoryResponse> {
  // --- MOCK: 疑似進捗（テスト用に短め・合計約5秒。本番の所要時間はWeek 5の
  //     Dify接続後に実際のストリーミングで決まるため、ここの数値は開発用） ---
  const STAGES: { to: number; stage: GenerateProgress["stage"]; ms: number }[] = [
    { to: 20, stage: "imagining", ms: 1200 },
    { to: 50, stage: "story_generation", ms: 1500 },
    { to: 90, stage: "image_generation", ms: 1500 },
    { to: 100, stage: "finalize", ms: 1000 },
  ];
  const TICK = 120;
  return new Promise((resolve, reject) => {
    let p = 0;
    const id = setInterval(() => {
      const si = Math.max(0, STAGES.findIndex((s) => p < s.to));
      const prevTo = si === 0 ? 0 : STAGES[si - 1].to;
      const perTick = (STAGES[si].to - prevTo) / (STAGES[si].ms / TICK);
      p = Math.min(100, p + perTick * (0.3 + Math.random() * 1.5));
      onProgress?.({ percent: Math.min(100, Math.round(p)), stage: STAGES[si].stage });
      // テスト用トリガー：お名前に「エラー」を含めると生成失敗を疑似再現できる
      if (p >= 35 && params?.child_name?.includes("エラー")) {
        clearInterval(id);
        resolve({ success: false, book_id: "", title: "", pages: [], error: "生成に失敗しました" });
        return;
      }
      if (p >= 100) {
        clearInterval(id);
        const book = mockBook(params);
        try { sessionStorage.setItem(BOOK_KEY(book.book_id), JSON.stringify(book)); } catch { /* ignore */ }
        resolve(book);
      }
    }, TICK);
    signal?.addEventListener("abort", () => {
      clearInterval(id);
      reject(new DOMException("aborted", "AbortError"));
    });
  });
}

/**
 * 絵本データ取得（Week 6でSupabase booksテーブルから取得に差し替え）
 * WEEK6: SELECT * FROM books WHERE id = :id AND user_id = :current_user
 */
export async function getBook(id: string): Promise<GenerateStoryResponse> {
  // --- MOCK: 生成直後はSessionStorageにあるものを返す。なければデフォルト ---
  try {
    const raw = sessionStorage.getItem(BOOK_KEY(id));
    if (raw) return JSON.parse(raw) as GenerateStoryResponse;
  } catch { /* ignore */ }
  return mockBook(loadExtractedParams());
}

/**
 * マイページの絵本一覧（Week 6でSupabaseから取得に差し替え）
 */
export async function listBooks(): Promise<LibraryBook[]> {
  // --- MOCK ---
  return [
    { id: "demo", title: "ゆうきくんの森の冒険", status: "paid", created_at: "2025-07-15", cover_emoji: "🌳", cover_tone: "from-[color:var(--sky)] to-[color:var(--butter)]" },
    { id: "b2", title: "さくらちゃんとお星さま", status: "paid", created_at: "2025-06-30", cover_emoji: "⭐", cover_tone: "from-[color:var(--butter)] to-[#FFB3A7]" },
    { id: "b3", title: "ひろとの海の大冒険", status: "completed", created_at: "-", cover_emoji: "🌊", cover_tone: "from-[color:var(--sky)] to-[#7FBEDB]" },
    { id: "b4", title: "こうたの そらの たび", status: "failed", created_at: "-", cover_emoji: "🎈", cover_tone: "from-[color:var(--butter)] to-[color:var(--sky)]" },
  ];
}

// ===== 絵本の細部調整（スタジオ機能。今はモック、WEEK5+でDifyに接続） =====

const placeholderImageAlt = (n: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#A8D8EA"/><text x="300" y="215" font-family="sans-serif" font-size="42" fill="#333333" text-anchor="middle">Page ${n} ✳</text></svg>`,
  )}`;

const mockTextsAlt = (name: string) => [
  `${name}が めを さますと、そこは ふしぎな もりの まえでした。`,
  "こみちの さきで、ちいさな うさぎが てを ふっています。",
  "「いっしょに たからものを さがそうよ！」と うさぎが いいました。",
  "ふたりは わくわくしながら あるきだしました。",
  "みたことのない おはなが いっぱいに さいています。",
  "あまいにおいの かぜが ふわりと ふきました。",
  "おおきな くまさんが にっこり わらって むかえてくれました。",
  "いわを のぼって、ちょうじょうを めざします。",
  "きらきら ひかる みずうみに くもが うつっています。",
  "はなびらが ひらひらと まいおちてきました。",
  "ほしたちが うたうように またたいています。",
  `あしたは どんな ぼうけんが まっているかな、と ${name}は おもいました。`,
];

function saveBook(book: GenerateStoryResponse) {
  try { sessionStorage.setItem(BOOK_KEY(book.book_id), JSON.stringify(book)); } catch { /* ignore */ }
}

/**
 * ページの描き直し（WEEK5+: Dify側にページ単位の再生成APIを追加してもらい接続。
 * 田中さんと要相談 — 現行のWeek 5計画には無い拡張機能）
 */
export async function regeneratePage(bookId: string, pageNumber: number): Promise<BookPage> {
  // --- MOCK: 1.2秒待って、本文とイラストを別バージョンに切り替える ---
  await new Promise((r) => setTimeout(r, 1200));
  const book = await getBook(bookId);
  const params = loadExtractedParams();
  const name = params?.child_name ? `${params.child_name}くん` : "たろうくん";
  const i = pageNumber - 1;
  const prim = mockTexts(name)[i];
  const isPrim = book.pages[i]?.text === prim;
  const next: BookPage = {
    page_number: pageNumber,
    text: isPrim ? mockTextsAlt(name)[i] : prim,
    image_url: isPrim ? placeholderImageAlt(pageNumber) : placeholderImage(pageNumber),
  };
  book.pages[i] = next;
  saveBook(book);
  return next;
}

/**
 * チャットでの調整指示（WEEK5+: dify-chatの調整モードに接続予定）
 */
export async function requestAdjustment(bookId: string, message: string): Promise<{ answer: string }> {
  // --- MOCK ---
  void bookId;
  await new Promise((r) => setTimeout(r, 900));
  return {
    answer: `わかりました！「${message}」ですね。そのイメージで調整していきます✨（いまはモックです。Week 5でAIにつながると、実際に絵本へ反映されます）`,
  };
}

/** タイトル変更（ローカル反映。WEEK6: booksテーブルのUPDATEに差し替え） */
export async function updateBookTitle(bookId: string, title: string): Promise<void> {
  const book = await getBook(bookId);
  book.title = title;
  saveBook(book);
}

/**
 * Stripe決済セッション作成（Edge Function: create-checkout-session）
 * WEEK7: POST `${API_BASE}/create-checkout-session` { book_id } に差し替え。
 * 本物は { checkout_url } が返るので window.location.href でリダイレクトする。
 */
export async function createCheckoutSession(bookId: string): Promise<{ checkout_url: string | null }> {
  // --- MOCK: 決済ページなし（nullを返すと画面側が疑似成功フローに進む） ---
  void bookId;
  await new Promise((r) => setTimeout(r, 1000));
  return { checkout_url: null };
}
