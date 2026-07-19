// Build a single self-contained, INTERACTIVE prototype of the DreamStories flow
// (landing → chat → generating → preview → checkout → mypage) that runs entirely
// client-side inside an Artifact. Landing & mypage are captured from the live app
// (pixel-faithful); the chat/generating/preview/checkout screens are reimplemented
// in vanilla JS mirroring the real route components, so the flow is actually
// clickable/typeable without a server. Regenerate after UI edits.
import { chromium } from "file:///opt/node22/lib/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/flow.html";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

// 1) Collect complete CSS by visiting every route.
const routes = ["/", "/create", "/generating", "/preview/demo", "/checkout/demo", "/mypage"];
const seen = new Set();
let css = "";
const captured = {};
for (const r of routes) {
  await page.goto(base + r, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(700);
  const { rules, body } = await page.evaluate(() => {
    const rules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) rules.push(rule.cssText);
      } catch {
        /* skip */
      }
    }
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script, noscript").forEach((n) => n.remove());
    clone.querySelectorAll("a[href]").forEach((a) => {
      a.setAttribute("data-href", a.getAttribute("href"));
      a.removeAttribute("href");
      a.style.cursor = "pointer";
    });
    return { rules, body: clone.innerHTML };
  });
  for (const rule of rules) {
    if (!seen.has(rule)) {
      seen.add(rule);
      css += rule + "\n";
    }
  }
  captured[r] = body;
}
await browser.close();

// 2) Static (captured) screens kept faithful to the live app.
const LANDING = captured["/"];
const MYPAGE = captured["/mypage"];

const doc = String.raw`<!-- Interactive DreamStories flow prototype (self-contained). -->
<style>
${css}
.route-page[hidden]{display:none !important;}
</style>

<div id="root"></div>

<div id="ds-toast" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 18px;border-radius:12px;font-size:14px;font-family:sans-serif;opacity:0;transition:opacity .25s;z-index:9999;pointer-events:none;"></div>

<script>
(function () {
  var LANDING = ${JSON.stringify(LANDING)};
  var MYPAGE = ${JSON.stringify(MYPAGE)};

  var WELCOME = "DreamStoriesへようこそ！お子さまの絵本を作りましょう。まず、お子さまのお名前を教えてください。";
  var THEMES = [
    { emoji:"🚀", label:"宇宙冒険" },
    { emoji:"🦖", label:"恐竜の世界" },
    { emoji:"🐟", label:"海の探検" },
    { emoji:"🌲", label:"魔法の森" },
    { emoji:"🎋", label:"お祭り冒険" }
  ];
  var PAGES = [
    {emoji:"🌅",text:"ある日、ゆうきくんは不思議な森へと出かけました。"},
    {emoji:"🐰",text:"森の入口で、白いうさぎに出会いました。"},
    {emoji:"🌳",text:"うさぎは「ぼくと一緒に冒険しない？」と言いました。"},
    {emoji:"🦋",text:"二人は森の奥へと進んでいきます。"},
    {emoji:"🏞️",text:"美しい花畑が広がっていました。"},
    {emoji:"🌈",text:"空には大きな虹がかかっています。"},
    {emoji:"🐻",text:"森のクマさんもお友だちになりました。"},
    {emoji:"⛰️",text:"山の頂上を目指して登ります。"},
    {emoji:"🌊",text:"海のような広い湖が見えました。"},
    {emoji:"🌸",text:"桜の木の下でひと休み。"},
    {emoji:"⭐",text:"夜には満天の星空が広がります。"},
    {emoji:"🎉",text:"ゆうきくんの冒険は、まだまだ続きます。"}
  ];

  var root = document.getElementById("root");
  var toastEl = document.getElementById("ds-toast");
  var timers = [];
  var screenCleanup = null; // per-screen listener teardown (keyboard/resize)
  function clearTimers(){ timers.forEach(function(t){ clearInterval(t); clearTimeout(t); }); timers = []; }
  function toast(msg){ toastEl.textContent = msg; toastEl.style.opacity = "1"; clearTimeout(toastEl._h); toastEl._h = setTimeout(function(){ toastEl.style.opacity="0"; }, 1800); }

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c]; }); }

  function header(){
    return '<header class="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">'
      + '<div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-1 sm:gap-2">'
      + '<a data-href="/" class="flex items-center gap-2 min-w-0" style="cursor:pointer">'
      + '<span class="inline-flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-base sm:text-lg">✦</span>'
      + '<span class="text-base sm:text-lg font-bold tracking-tight truncate" style="font-family:var(--font-display)">DreamStories</span></a>'
      + '<nav class="flex items-center gap-1 sm:gap-2 shrink-0">'
      + '<a data-href="/mypage" class="btn-ghost text-sm whitespace-nowrap !px-2.5 sm:!px-3" style="cursor:pointer">マイページ</a>'
      + '<button data-toast="ログイン機能はこの後のステップで実装予定です" class="btn-secondary text-sm whitespace-nowrap !py-2 !px-3 sm:!px-4">ログイン</button>'
      + '</nav></div></header>';
  }

  // Simple header (logo + back) for the onboard chat.
  function simpleHeader(){
    return '<header class="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">'
      + '<div class="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">'
      + '<a data-href="/" class="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" style="cursor:pointer" aria-label="戻る">←</a>'
      + '<a data-href="/" class="flex items-center gap-2" style="cursor:pointer">'
      + '<span class="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[color:var(--coral)] text-white text-base">✦</span>'
      + '<span class="text-base font-bold tracking-tight" style="font-family:var(--font-display)">DreamStories</span></a>'
      + '</div></header>';
  }

  // ---- Screen: create (chat) ----
  var TOTAL = 4;
  function renderCreate(){
    var step = 0, mode = "text", typing = false;
    var info = { name:"", age:"" };
    var placeholders = ["お名前を入力...", "年齢を入力...", "好きなものを入力..."];

    root.innerHTML = simpleHeader()
      + '<div class="min-h-screen flex flex-col bg-[color:var(--cream)]">'
      + '<div class="mx-auto w-full max-w-2xl px-4 pt-3">'
      + '<div class="flex items-center justify-between text-xs text-[color:var(--muted-foreground)] mb-1.5"><span>お子さまについて教えてください</span><span id="chatProg" class="font-semibold text-[color:var(--coral)] tabular-nums">1 / 4</span></div>'
      + '<div class="h-1.5 w-full rounded-full bg-[color:var(--muted)] overflow-hidden"><div id="chatBar" class="h-full rounded-full bg-[color:var(--coral)] transition-all duration-500" style="width:25%"></div></div></div>'
      + '<main class="flex-1 mx-auto w-full max-w-2xl px-4 py-4 flex flex-col min-h-0">'
      + '<div id="chatScroll" class="flex-1 overflow-y-auto space-y-3 pb-4"></div>'
      + '<div id="chatDock" class="sticky bottom-2 bg-[color:var(--cream)]/90 backdrop-blur pt-2"></div>'
      + '</main></div>';

    var scroll = document.getElementById("chatScroll");
    var dock = document.getElementById("chatDock");
    var prog = document.getElementById("chatProg"), bar = document.getElementById("chatBar");

    function setProgress(){ var p = Math.min(step+1, TOTAL); prog.textContent = p + " / " + TOTAL; bar.style.width = (p/TOTAL*100) + "%"; }
    function scrollDown(){ scroll.scrollTo({ top: scroll.scrollHeight, behavior:"smooth" }); }

    function bubble(m){
      var wrap = document.createElement("div");
      wrap.className = "flex " + (m.role==="user"?"justify-end":"justify-start") + " animate-in fade-in slide-in-from-bottom-2 duration-300";
      wrap.innerHTML = (m.role==="ai" ? '<div class="mr-2 h-9 w-9 shrink-0 rounded-full bg-[color:var(--butter)] flex items-center justify-center">🧚</div>' : '')
        + '<div class="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ' + (m.role==="user" ? 'bg-[color:var(--sky)] text-[#1F3A47] rounded-br-md' : 'bg-[#FFE9EA] text-[#5B4145] rounded-bl-md') + '">' + esc(m.text) + '</div>';
      scroll.appendChild(wrap); scrollDown();
    }
    function showTyping(on){
      var ex = document.getElementById("typingRow");
      if(on){
        if(ex) return;
        var row = document.createElement("div");
        row.id = "typingRow";
        row.className = "flex justify-start animate-in fade-in duration-200";
        row.innerHTML = '<div class="mr-2 h-9 w-9 shrink-0 rounded-full bg-[color:var(--butter)] flex items-center justify-center">🧚</div>'
          + '<div class="rounded-2xl rounded-bl-md bg-[#FFE9EA] text-[color:var(--coral)] px-4 py-4 shadow-sm flex items-center gap-1.5">'
          + '<span class="ds-dot"></span><span class="ds-dot" style="animation-delay:.2s"></span><span class="ds-dot" style="animation-delay:.4s"></span></div>';
        scroll.appendChild(row); scrollDown();
      } else if(ex){ ex.remove(); }
    }
    function aiSay(text, after){
      typing = true; renderDock(); showTyping(true);
      timers.push(setTimeout(function(){ typing = false; showTyping(false); bubble({role:"ai",text:text}); renderDock(); if(after) after(); }, 900));
    }

    function renderDock(){
      if(mode === "theme"){
        dock.innerHTML = '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">'
          + THEMES.map(function(t){ return '<button data-theme="'+t.label+'" data-emoji="'+t.emoji+'"'+(typing?' disabled':'')+' class="rounded-2xl border-2 border-[color:var(--coral)] bg-white px-3 py-3 text-sm font-semibold text-[color:var(--coral)] hover:bg-[color:var(--coral)] hover:text-white transition-colors disabled:opacity-50"><span class="text-lg mr-1">'+t.emoji+'</span>'+t.label+'</button>'; }).join("")
          + '</div>';
      } else if(mode === "done"){
        dock.innerHTML = '<div class="text-center text-sm text-[color:var(--muted-foreground)] py-3">絵本の生成を開始しています...</div>';
      } else {
        dock.innerHTML = '<form id="chatForm" class="flex gap-2"><input id="chatInput" placeholder="'+(placeholders[step]||"メッセージを入力...")+'"'+(typing?' disabled':'')+' class="flex-1 rounded-2xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40 disabled:opacity-60" /><button type="submit"'+(typing?' disabled':'')+' class="btn-primary !py-3 !px-5 disabled:opacity-50">送信</button></form>';
        var form = document.getElementById("chatForm"), input = document.getElementById("chatInput");
        if(input && !typing) input.focus();
        if(form) form.addEventListener("submit", function(e){ e.preventDefault(); sendText(input.value); });
      }
    }
    function sendText(raw){
      var v = (raw||"").trim();
      if(!v || mode!=="text" || typing) return;
      bubble({role:"user",text:v});
      if(step===0){ info.name=v; step=1; setProgress(); aiSay(info.name+"ちゃんですね！おいくつですか？"); }
      else if(step===1){ info.age=v; step=2; setProgress(); aiSay(info.name+"ちゃんは"+v+"歳ですね。普段、どんなことが好きですか？"); }
      else if(step===2){ step=3; setProgress(); aiSay("素敵ですね！以下のテーマから選んでいただけますか？", function(){ mode="theme"; renderDock(); }); }
    }
    dock._choose = function(label, emoji){
      if(mode!=="theme" || typing) return;
      bubble({role:"user",text:emoji+" "+label});
      mode = "done"; renderDock();
      aiSay("ありがとうございます！"+info.name+"ちゃんの"+label+"の絵本を作りますね。生成を開始します...", function(){ timers.push(setTimeout(function(){ navigate("/generating"); }, 3000)); });
    };

    setProgress();
    renderDock();
    aiSay(WELCOME);
  }

  // ---- Screen: generating ----
  var STATUSES = [
    { at:0, text:"準備をしています..." },
    { at:15, text:"物語を書いています..." },
    { at:55, text:"イラストを描いています..." },
    { at:85, text:"ページを組み立てています..." },
    { at:100, text:"完成しました！" }
  ];
  function statusFor(p){ for(var i=STATUSES.length-1;i>=0;i--){ if(p>=STATUSES[i].at) return STATUSES[i].text; } return ""; }
  function renderGenerating(){
    root.innerHTML = header()
      + '<div class="min-h-screen flex flex-col"><main class="flex-1 flex items-center justify-center px-4">'
      + '<div class="w-full max-w-md card-soft text-center">'
      + '<div class="mx-auto relative h-28 w-28">'
      + '<div class="absolute inset-0 rounded-full bg-[color:var(--butter)] animate-pulse"></div>'
      + '<div class="absolute inset-2 rounded-full bg-white flex items-center justify-center text-4xl">📖</div>'
      + '<div class="absolute inset-0 rounded-full border-4 border-transparent border-t-[color:var(--coral)] animate-spin"></div></div>'
      + '<h1 id="genStatus" class="mt-6 text-xl"></h1>'
      + '<p class="mt-1 text-xs text-[color:var(--muted-foreground)]">絵本を生成中です。しばらくお待ちください。</p>'
      + '<div class="mt-6"><div class="h-3 w-full rounded-full bg-[color:var(--muted)] overflow-hidden">'
      + '<div id="genBar" class="h-full bg-gradient-to-r from-[color:var(--coral)] to-[color:var(--butter)] transition-all duration-200" style="width:0%"></div></div>'
      + '<div id="genPct" class="mt-2 text-sm font-semibold text-[color:var(--coral)]">0%</div></div>'
      + '</div></main></div>';
    var p = 0;
    var bar = document.getElementById("genBar"), pct = document.getElementById("genPct"), st = document.getElementById("genStatus");
    st.textContent = statusFor(0);
    var id = setInterval(function(){
      p = Math.min(100, p + 2);
      bar.style.width = p + "%"; pct.textContent = p + "%"; st.textContent = statusFor(p);
      if(p >= 100){ clearInterval(id); timers.push(setTimeout(function(){ navigate("/preview/demo"); }, 700)); }
    }, 120);
    timers.push(id);
  }

  // ---- Screen: preview ----
  var PV_TITLE = "たろうくんの ぼうけん";
  var PV_TEXTS = [
    "むかしむかし、たろうくんは、ふしぎな もりへ でかけました。",
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
    "たろうくんの ぼうけんは、まだまだ つづきます。"
  ];
  function pvPlaceholder(n){ return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><rect width="600" height="400" fill="#FFE5A0"/><text x="300" y="215" font-family="sans-serif" font-size="42" fill="#333333" text-anchor="middle">Page ' + n + '</text></svg>'); }

  function renderPreview(){
    var total = PV_TEXTS.length;
    var index = 0, flipping = false, DUR = 700, EASE = "cubic-bezier(0.42, 0, 0.2, 1)";
    function per(){ return window.innerWidth < 768 ? 1 : 2; }
    function stageMax(){ return per() === 1 ? 460 : 880; }

    root.innerHTML =
      '<header class="sticky top-0 z-40 backdrop-blur bg-[color:var(--cream)]/80 border-b border-[color:var(--border)]">'
      + '<div class="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-3">'
      + '<a data-href="/mypage" class="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" style="cursor:pointer" aria-label="戻る">←</a>'
      + '<div class="font-bold truncate text-center" style="font-family:var(--font-display)">' + PV_TITLE + '</div>'
      + '<button data-toast="共有リンクをコピーしました" class="h-9 w-9 shrink-0 rounded-full border border-[color:var(--border)] bg-white flex items-center justify-center text-[color:var(--muted-foreground)]" aria-label="共有">🔗</button>'
      + '</div></header>'
      + '<div class="min-h-screen flex flex-col bg-[color:var(--cream)]">'
      + '<main class="flex-1 mx-auto w-full max-w-5xl px-4 py-6">'
      + '<div class="text-center text-xs text-[color:var(--muted-foreground)] mb-3">プレビュー #demo</div>'
      + '<div class="relative">'
      + '<div id="pvPersp" class="mx-auto w-full select-none" style="perspective:1800px;touch-action:pan-y"><div id="pvStage" class="relative rounded-2xl shadow-[0_18px_45px_-18px_rgba(120,90,70,0.5)]"></div></div>'
      + '<button id="pvPrev" class="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20" aria-label="前へ">←</button>'
      + '<button id="pvNext" class="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-white shadow-md border border-[color:var(--border)] text-xl text-[color:var(--coral)] disabled:opacity-30 transition z-20" aria-label="次へ">→</button>'
      + '</div>'
      + '<div class="mt-6 flex items-center justify-center gap-3"><div id="pvDots" class="flex gap-1.5"></div><span id="pvLabel" class="text-sm text-[color:var(--muted-foreground)] tabular-nums"></span></div>'
      + '</main>'
      + '<div class="sticky bottom-0 border-t border-[color:var(--border)] bg-[color:var(--cream)]/90 backdrop-blur"><div class="mx-auto max-w-5xl px-4 py-3"><a id="pvBuy" data-href="/checkout/demo" class="btn-primary w-full text-base !py-4 transition" style="cursor:pointer">この絵本を購入する（5,000円）</a></div></div>'
      + '</div>';

    var persp = document.getElementById("pvPersp"), stage = document.getElementById("pvStage");
    var prevBtn = document.getElementById("pvPrev"), nextBtn = document.getElementById("pvNext");

    function pageHTML(i, side){
      var round = side==="left" ? "rounded-l-2xl" : side==="right" ? "rounded-r-2xl" : "rounded-2xl";
      var spine = side==="left" ? "bg-gradient-to-l from-black/12 to-transparent right-0" : side==="right" ? "bg-gradient-to-r from-black/12 to-transparent left-0" : "hidden";
      // Fixed geometry so the book never resizes with text length.
      if(i<0 || i>=total) return '<div class="flex flex-col bg-[color:var(--cream)] overflow-hidden '+round+'"><div class="w-full aspect-[3/2]"></div><div class="h-40 md:h-44"></div></div>';
      var n = i+1;
      return '<div class="relative flex flex-col bg-white overflow-hidden '+round+'">'
        + '<div class="pointer-events-none absolute inset-y-0 w-6 z-10 '+spine+'"></div>'
        + '<img src="'+pvPlaceholder(n)+'" alt="ページ'+n+'のイラスト" class="w-full aspect-[3/2] object-cover" draggable="false" />'
        + '<div class="p-5 md:p-7 h-40 md:h-44 flex flex-col"><p class="text-base md:text-lg leading-loose flex-1 overflow-hidden" style="font-family:var(--font-display)">'+esc(PV_TEXTS[i])+'</p><div class="mt-2 text-xs text-[color:var(--muted-foreground)] text-right">— '+n+' —</div></div></div>';
    }
    function spreadHTML(l, r){
      if(per()===1) return pageHTML(l,"single");
      return '<div class="flex"><div class="w-1/2">'+pageHTML(l,"left")+'</div><div class="w-1/2">'+pageHTML(r,"right")+'</div></div>';
    }
    function showStatic(){ persp.style.maxWidth = stageMax()+"px"; stage.innerHTML = spreadHTML(index, index+1); }

    function updateChrome(){
      var p = per(), lastIndex = (Math.ceil(total/p)-1)*p, atStart = index===0, atEnd = index>=lastIndex;
      var views = Math.ceil(total/p), cur = Math.floor(index/p);
      var dots = document.getElementById("pvDots"); dots.innerHTML = "";
      for(var v=0; v<views; v++){ var s = document.createElement("span"); s.className = "h-2 rounded-full transition-all " + (v===cur ? "w-5 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]"); dots.appendChild(s); }
      var lbl = document.getElementById("pvLabel");
      lbl.textContent = p>1 ? (index+1)+"–"+Math.min(index+p,total)+" / "+total : (index+1)+" / "+total;
      lbl.classList.remove("animate-in","fade-in","zoom-in-95"); void lbl.offsetWidth; lbl.classList.add("animate-in","fade-in","zoom-in-95");
      prevBtn.disabled = atStart || flipping; nextBtn.disabled = atEnd || flipping;
      var buy = document.getElementById("pvBuy");
      if(atEnd){ buy.classList.add("ring-4","ring-[color:var(--butter)]","scale-[1.01]"); } else { buy.classList.remove("ring-4","ring-[color:var(--butter)]","scale-[1.01]"); }
    }

    function doFlip(dir){
      var p = per(), lastIndex = (Math.ceil(total/p)-1)*p;
      if(flipping) return;
      if(dir>0 && index>=lastIndex) return;
      if(dir<0 && index===0) return;
      flipping = true; updateChrome();
      var end = dir>0 ? -180 : 180;
      var baseL, baseR, frontIdx, backIdx, frontSide, backSide, leafCss;
      if(p===2){
        if(dir>0){ baseL=index; baseR=index+3; frontIdx=index+1; backIdx=index+2; leafCss="left:50%;width:50%;top:0;bottom:0;transform-origin:left center;"; frontSide="right"; backSide="left"; }
        else { baseL=index-2; baseR=index+1; frontIdx=index; backIdx=index-1; leafCss="left:0;width:50%;top:0;bottom:0;transform-origin:right center;"; frontSide="left"; backSide="right"; }
      } else {
        if(dir>0){ baseL=index+1; baseR=index+1; frontIdx=index; backIdx=index+1; }
        else { baseL=index-1; baseR=index-1; frontIdx=index; backIdx=index-1; }
        leafCss = "inset:0;transform-origin:"+(dir>0?"left":"right")+" center;"; frontSide="single"; backSide="single";
      }
      stage.innerHTML = spreadHTML(baseL, baseR)
        + '<div id="pvLeaf" class="absolute" style="transform-style:preserve-3d;'+leafCss+'transform:rotateY(0deg);will-change:transform;">'
        + '<div class="absolute inset-0" style="backface-visibility:hidden">'+pageHTML(frontIdx,frontSide)+'<div id="pvShF" class="pointer-events-none absolute inset-0 bg-black" style="opacity:0"></div></div>'
        + '<div class="absolute inset-0" style="backface-visibility:hidden;transform:rotateY(180deg)">'+pageHTML(backIdx,backSide)+'<div id="pvShB" class="pointer-events-none absolute inset-0 bg-black" style="opacity:0.28"></div></div>'
        + '</div>';
      var leaf = document.getElementById("pvLeaf"), shF = document.getElementById("pvShF"), shB = document.getElementById("pvShB");
      requestAnimationFrame(function(){ requestAnimationFrame(function(){
        leaf.style.transition = "transform "+DUR+"ms "+EASE; leaf.style.transform = "rotateY("+end+"deg)";
        shF.style.transition = "opacity "+DUR+"ms "+EASE; shF.style.opacity = "0.28";
        shB.style.transition = "opacity "+DUR+"ms "+EASE; shB.style.opacity = "0";
      }); });
      setTimeout(function(){
        index = dir>0 ? Math.min(index+p, lastIndex) : Math.max(index-p, 0);
        showStatic(); flipping = false; updateChrome();
      }, DUR);
    }

    prevBtn.addEventListener("click", function(){ doFlip(-1); });
    nextBtn.addEventListener("click", function(){ doFlip(1); });

    // swipe (trigger a flip)
    var down = null;
    persp.addEventListener("pointerdown", function(e){ if(!flipping) down = e.clientX; });
    persp.addEventListener("pointerup", function(e){ if(down==null) return; var dx = e.clientX - down; down = null; if(dx>45) doFlip(1); else if(dx<-45) doFlip(-1); });

    // keyboard + resize (cleaned up on screen change)
    var onKey = function(e){ if(e.key==="ArrowRight") doFlip(1); if(e.key==="ArrowLeft") doFlip(-1); };
    var onResize = function(){ index = Math.floor(index/per())*per(); showStatic(); updateChrome(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    screenCleanup = function(){ window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };

    showStatic(); updateChrome();
  }

  // ---- Screen: checkout ----
  function renderCheckout(){
    root.innerHTML = header()
      + '<div class="min-h-screen flex flex-col"><main class="flex-1 mx-auto w-full max-w-4xl px-4 py-8 grid gap-6 md:grid-cols-[1fr_1.2fr]">'
      + '<div class="card-soft"><div class="aspect-[3/4] rounded-2xl bg-gradient-to-br from-[color:var(--sky)]/40 via-[color:var(--butter)]/50 to-[color:var(--coral)]/40 flex items-center justify-center text-7xl">📖</div>'
      + '<h2 class="mt-4 text-lg">ゆうきくんの森の冒険</h2>'
      + '<p class="text-sm text-[color:var(--muted-foreground)]">全12ページ / デジタル版</p>'
      + '<div class="mt-4 flex items-baseline justify-between"><span class="text-sm text-[color:var(--muted-foreground)]">価格</span><span class="text-2xl font-bold text-[color:var(--coral)]">¥5,000</span></div></div>'
      + '<form id="payForm" class="card-soft"><h1 class="text-xl">お支払い情報</h1>'
      + '<p class="mt-1 text-xs text-[color:var(--muted-foreground)]">Stripeによる安全な決済（後で統合されます）</p>'
      + '<div class="mt-5 space-y-4">'
      + '<div><label class="text-xs font-semibold">メールアドレス</label><input type="email" required placeholder="you@example.com" class="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" /></div>'
      + '<div><label class="text-xs font-semibold">カード番号</label><input required placeholder="1234 5678 9012 3456" class="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" /></div>'
      + '<div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-semibold">有効期限</label><input required placeholder="MM / YY" class="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" /></div>'
      + '<div><label class="text-xs font-semibold">CVC</label><input required placeholder="123" class="mt-1 w-full rounded-xl border border-[color:var(--border)] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[color:var(--coral)]/40" /></div></div></div>'
      + '<button id="payBtn" class="btn-primary mt-6 w-full text-base disabled:opacity-60">¥5,000を支払って購入する</button>'
      + '<p class="mt-3 text-[11px] text-center text-[color:var(--muted-foreground)]">絵本ID: demo</p></form></main></div>';
    document.getElementById("payForm").addEventListener("submit", function(e){
      e.preventDefault();
      var btn = document.getElementById("payBtn");
      btn.disabled = true; btn.textContent = "処理中...";
      timers.push(setTimeout(function(){
        toast("購入が完了しました！");
        timers.push(setTimeout(function(){ navigate("/mypage"); }, 1200));
      }, 1000));
    });
  }

  // ---- Router ----
  function screenFor(path){
    if(path === "/" ) return "landing";
    if(path.indexOf("/create") === 0) return "create";
    if(path.indexOf("/generating") === 0) return "generating";
    if(path.indexOf("/preview") === 0) return "preview";
    if(path.indexOf("/checkout") === 0) return "checkout";
    if(path.indexOf("/mypage") === 0) return "mypage";
    return "landing";
  }
  function render(){
    clearTimers();
    if(screenCleanup){ screenCleanup(); screenCleanup = null; }
    var path = (location.hash.slice(1) || "/");
    var s = screenFor(path);
    if(s === "landing"){ root.innerHTML = LANDING; }
    else if(s === "mypage"){ root.innerHTML = MYPAGE; }
    else if(s === "create"){ renderCreate(); }
    else if(s === "generating"){ renderGenerating(); }
    else if(s === "preview"){ renderPreview(); }
    else if(s === "checkout"){ renderCheckout(); }
    window.scrollTo(0,0);
  }
  function navigate(path){ if(("#"+path) !== location.hash){ location.hash = path; } else { render(); } }

  function normalize(href){ try{ href = new URL(href, location.origin).pathname; }catch(e){} if(href.length>1 && href.endsWith("/")) href = href.slice(0,-1); return href; }
  document.addEventListener("click", function(e){
    var th = e.target.closest ? e.target.closest("[data-theme]") : null;
    if(th){
      var dock = document.getElementById("chatDock");
      if(dock && dock._choose) dock._choose(th.getAttribute("data-theme"), th.getAttribute("data-emoji"));
      return;
    }
    var t = e.target.closest ? e.target.closest("[data-toast]") : null;
    if(t){ toast(t.getAttribute("data-toast")); return; }
    var el = e.target.closest ? e.target.closest("[data-href]") : null;
    if(!el) return;
    e.preventDefault();
    navigate(normalize(el.getAttribute("data-href")));
  });
  window.addEventListener("hashchange", render);
  if(!location.hash) location.hash = "/create"; else render();
})();
</script>`;

writeFileSync(out, doc);
console.log("saved", out, `(${(doc.length / 1024).toFixed(0)} KB)`);
