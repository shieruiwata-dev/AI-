// Uses the globally-installed Playwright (not a project dependency), so the
// app's package.json stays pristine.
import { chromium } from "file:///opt/node22/lib/node_modules/playwright/index.mjs";

const url = process.argv[2] || "http://127.0.0.1:8080/";
const out = process.argv[3] || "/tmp/shot.png";
const width = Number(process.argv[4] || 390);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width, height: 844 },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log("saved", out);
