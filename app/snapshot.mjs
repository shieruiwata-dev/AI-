// Capture the fully-rendered landing page from the running dev server and emit
// a self-contained HTML file (inlined CSS) that can be published as an Artifact
// for inline preview. Fonts fall back to system stacks under the Artifact CSP.
import { chromium } from "file:///opt/node22/lib/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const out = process.argv[3] || "/tmp/snapshot.html";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1000);

const { html, css } = await page.evaluate(() => {
  let css = "";
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      for (const rule of Array.from(sheet.cssRules)) css += rule.cssText + "\n";
    } catch {
      /* cross-origin sheet, skip */
    }
  }
  // Clone the body, strip scripts, and neutralize navigation so the static
  // preview doesn't try to route to pages that don't exist in the snapshot.
  const clone = document.body.cloneNode(true);
  clone.querySelectorAll("script, noscript").forEach((n) => n.remove());
  clone.querySelectorAll("a[href]").forEach((a) => {
    a.setAttribute("data-href", a.getAttribute("href"));
    a.removeAttribute("href");
    a.style.cursor = "pointer";
  });
  return { html: clone.innerHTML, css };
});

const doc = `<!-- Snapshot of the live landing page (dev server). Preview only. -->
<style>
${css}
</style>
<div id="app-snapshot">
${html}
</div>`;

writeFileSync(out, doc);
await browser.close();
console.log("saved", out, `(${(doc.length / 1024).toFixed(0)} KB)`);
