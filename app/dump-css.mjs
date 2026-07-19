// Visit every route so Tailwind generates all used classes, then dump the
// merged, deduped CSS to a file for reuse in a self-contained prototype.
import { chromium } from "file:///opt/node22/lib/node_modules/playwright/index.mjs";
import { writeFileSync } from "node:fs";

const base = process.argv[2] || "http://127.0.0.1:8080";
const out = process.argv[3] || "/tmp/app.css";
const routes = ["/", "/create", "/generating", "/preview/demo", "/checkout/demo", "/mypage"];

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const seen = new Set();
let css = "";
for (const r of routes) {
  await page.goto(base + r, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(700);
  const rules = await page.evaluate(() => {
    const out = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) out.push(rule.cssText);
      } catch {
        /* skip */
      }
    }
    return out;
  });
  for (const rule of rules) {
    if (!seen.has(rule)) {
      seen.add(rule);
      css += rule + "\n";
    }
  }
}
await browser.close();
writeFileSync(out, css);
console.log("wrote", out, `(${(css.length / 1024).toFixed(0)} KB, ${seen.size} rules)`);
