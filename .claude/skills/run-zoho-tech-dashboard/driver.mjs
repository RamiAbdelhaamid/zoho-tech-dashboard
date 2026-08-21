// Playwright driver for zoho-tech-dashboard. chromium-cli is not available
// in this environment, so this is a small raw-Playwright equivalent: launch
// headless Chromium, log in with the throwaway test account (see
// test-user.mjs), walk the four tabs and the pick/status workflow, and
// screenshot each step. Screenshots land in ./screenshots/.
//
// The frontend is styled entirely with Tailwind utility classes (no
// semantic class names like .card/.wf-btn exist anymore) — selectors here
// deliberately use text content, placeholders, and tags instead of classes,
// since utility classes are the wrong thing to select on and will churn
// with every visual tweak. Nav-tab clicks are scoped to the sidebar's <nav>
// specifically — the page also has an Activity Feed panel whose entries can
// contain the same words ("... Resolved on #262140"), so an unscoped
// text-match risks a strict-mode multi-match once that feed has entries.
//
// Usage: node driver.mjs [frontendUrl]
//   node driver.mjs                       # defaults to http://localhost:5180
//   node driver.mjs http://localhost:5180

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, "screenshots");
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const BASE_URL = process.argv[2] || "http://localhost:5180";
const USERNAME = "test.driver@azm.com";
const PASSWORD = "DriverPass123!";

function shot(page, name) {
  return page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`) });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  console.log(`[driver] navigating to ${BASE_URL}`);
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector("form", { timeout: 15000 });
  await shot(page, "01-login");

  console.log("[driver] logging in as", USERNAME);
  await page.fill('input[autocomplete="username"]', USERNAME);
  await page.fill('input[autocomplete="current-password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Search box only renders once the dashboard shell (Sidebar, Tickets tab)
  // has mounted, regardless of whether any tickets are in scope yet.
  await page.waitForSelector('input[placeholder*="Search ticket"]', { timeout: 15000 });
  await page.waitForTimeout(1200); // let the initial socket payload settle
  await shot(page, "02-tickets-tab");

  const nav = page.locator("nav");

  console.log("[driver] My Work tab");
  await nav.locator('button:has-text("My Work")').click();
  await page.waitForTimeout(600);
  await shot(page, "03-my-work");

  console.log("[driver] Team tab");
  await nav.locator('button:has-text("Team")').click();
  await page.waitForTimeout(600);
  await shot(page, "04-team");

  console.log("[driver] Resolved tab");
  await nav.locator('button:has-text("Resolved")').click();
  await page.waitForTimeout(600);
  await shot(page, "05-resolved");

  console.log("[driver] back to Tickets, picking up the first available ticket");
  await nav.locator('button:has-text("Tickets")').click();
  await page.waitForTimeout(600);
  const pickBtn = page.locator('button:has-text("Pick Up")').first();
  if (await pickBtn.count()) {
    await pickBtn.click();
    await page.waitForTimeout(800);
    await shot(page, "06-picked-ticket");
  } else {
    console.log("[driver] no unassigned ticket available to pick — skipping");
  }

  await browser.close();

  console.log(`[driver] done — screenshots in ${SCREENSHOT_DIR}`);
  if (consoleErrors.length) {
    console.log("[driver] console errors seen:");
    for (const e of consoleErrors) console.log("  -", e);
    process.exitCode = 1;
  } else {
    console.log("[driver] no console errors");
  }
}

main().catch((err) => {
  console.error("[driver] failed:", err.message);
  process.exit(1);
});
