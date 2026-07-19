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
  var pv = { page: 0 };
  function renderPreview(){
    pv.page = 0;
    root.innerHTML = header()
      + '<div class="min-h-screen flex flex-col"><main class="flex-1 mx-auto w-full max-w-4xl px-4 py-6">'
      + '<div class="text-center text-sm text-[color:var(--muted-foreground)] mb-3">プレビュー #demo</div>'
      + '<div class="relative">'
      + '<div class="card-soft !p-0 overflow-hidden aspect-[4/5] md:aspect-[3/2] flex flex-col md:flex-row">'
      + '<div id="pvEmoji" class="flex-1 bg-gradient-to-br from-[color:var(--sky)]/40 via-[color:var(--butter)]/40 to-[color:var(--coral)]/30 flex items-center justify-center text-8xl md:text-9xl"></div>'
      + '<div class="md:w-2/5 p-6 md:p-10 flex flex-col justify-center bg-white">'
      + '<p id="pvText" class="text-lg md:text-xl leading-relaxed" style="font-family:var(--font-display)"></p>'
      + '<div id="pvNum" class="mt-6 text-xs text-[color:var(--muted-foreground)]"></div></div></div>'
      + '<button id="pvPrev" class="absolute left-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white shadow-md border border-[color:var(--border)] disabled:opacity-40">←</button>'
      + '<button id="pvNext" class="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white shadow-md border border-[color:var(--border)] disabled:opacity-40">→</button>'
      + '</div>'
      + '<div id="pvDots" class="mt-4 flex justify-center gap-1.5"></div>'
      + '<div class="mt-8 flex justify-center"><a data-href="/checkout/demo" class="btn-primary text-base" style="cursor:pointer">この絵本を購入する</a></div>'
      + '</main></div>';
    function paint(){
      var c = PAGES[pv.page];
      document.getElementById("pvEmoji").textContent = c.emoji;
      document.getElementById("pvText").textContent = c.text;
      document.getElementById("pvNum").textContent = "ページ " + (pv.page+1) + " / " + PAGES.length;
      document.getElementById("pvPrev").disabled = pv.page === 0;
      document.getElementById("pvNext").disabled = pv.page === PAGES.length-1;
      var dots = document.getElementById("pvDots"); dots.innerHTML = "";
      PAGES.forEach(function(_, i){
        var b = document.createElement("button");
        b.className = "h-2 rounded-full transition-all " + (i===pv.page ? "w-6 bg-[color:var(--coral)]" : "w-2 bg-[color:var(--border)]");
        b.addEventListener("click", function(){ pv.page = i; paint(); });
        dots.appendChild(b);
      });
    }
    document.getElementById("pvPrev").addEventListener("click", function(){ if(pv.page>0){ pv.page--; paint(); } });
    document.getElementById("pvNext").addEventListener("click", function(){ if(pv.page<PAGES.length-1){ pv.page++; paint(); } });
    paint();
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
