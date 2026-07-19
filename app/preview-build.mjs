// Build a single self-contained, CLICKABLE preview from the running dev server.
// Captures several routes, dedupes CSS, neutralizes the app's own scripts, and
// wires internal links so navigation between the captured pages works inside an
// Artifact (no live server needed). Intra-page React behavior (chat typing, FAQ
// accordion, progress animation) is still static — those need the live app.
import { chromium } from "file:///opt/node22/lib/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/preview.html";

const ROUTES = [
  { path: "/", label: "トップ" },
  { path: "/create", label: "チャット" },
  { path: "/generating", label: "生成中" },
  { path: "/mypage", label: "マイページ" },
];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

let mergedCss = "";
const seenCss = new Set();
const pages = [];

for (const route of ROUTES) {
  await page.goto(base + route.path, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(900);
  const { html, cssRules } = await page.evaluate(() => {
    const rules = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) rules.push(rule.cssText);
      } catch {
        /* skip cross-origin */
      }
    }
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll("script, noscript").forEach((n) => n.remove());
    // Keep internal targets as data-href so our nav script can handle them.
    clone.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      a.setAttribute("data-href", href);
      a.removeAttribute("href");
      a.style.cursor = "pointer";
    });
    return { html: clone.innerHTML, cssRules: rules };
  });
  for (const r of cssRules) {
    if (!seenCss.has(r)) {
      seenCss.add(r);
      mergedCss += r + "\n";
    }
  }
  pages.push({ ...route, html });
}

await browser.close();

const routeDivs = pages
  .map(
    (p, i) =>
      `<div class="route-page" data-route="${p.path}"${i === 0 ? "" : ' hidden'}>${p.html}</div>`,
  )
  .join("\n");

const knownRoutes = JSON.stringify(pages.map((p) => p.path));

const navScript = `
<script>
(function () {
  var routes = ${knownRoutes};
  function normalize(href) {
    if (!href) return null;
    try { href = new URL(href, location.origin).pathname; } catch (e) {}
    if (href.length > 1 && href.endsWith("/")) href = href.slice(0, -1);
    return href;
  }
  function match(path) {
    if (routes.indexOf(path) !== -1) return path;
    // prefix match for dynamic routes like /preview/xxx -> /preview if captured
    for (var i = 0; i < routes.length; i++) {
      if (routes[i] !== "/" && path.indexOf(routes[i] + "/") === 0) return routes[i];
    }
    return null;
  }
  function show(path) {
    var target = match(path) || "/";
    var pages = document.querySelectorAll(".route-page");
    for (var i = 0; i < pages.length; i++) {
      pages[i].hidden = pages[i].getAttribute("data-route") !== target;
    }
    window.scrollTo(0, 0);
    if (location.hash.slice(1) !== target) history.replaceState(null, "", "#" + target);
  }
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("[data-href]") : null;
    if (!el) return;
    var path = normalize(el.getAttribute("data-href"));
    if (!path) return;
    e.preventDefault();
    if (match(path)) {
      show(path);
    } else {
      // captured pages don't include this route (e.g. a specific book id)
      var t = document.getElementById("preview-toast");
      if (t) { t.style.opacity = "1"; clearTimeout(t._h); t._h = setTimeout(function(){ t.style.opacity="0"; }, 1800); }
    }
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1) || "/"); });
  show(location.hash.slice(1) || "/");
})();
</script>
<div id="preview-toast" style="position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:10px 16px;border-radius:12px;font-size:13px;font-family:sans-serif;opacity:0;transition:opacity .25s;z-index:9999;pointer-events:none;">このページはプレビュー未取得です（実アプリでは遷移します）</div>
`;

const doc = `<!-- Clickable multi-route preview of the DreamStories app (dev snapshot). -->
<style>
${mergedCss}
.route-page[hidden]{display:none !important;}
</style>
${routeDivs}
${navScript}`;

writeFileSync(out, doc);
console.log("saved", out, `(${(doc.length / 1024).toFixed(0)} KB, ${pages.length} routes)`);
