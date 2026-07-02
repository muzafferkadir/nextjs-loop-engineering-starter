#!/usr/bin/env node
/**
 * snap — deterministic page screenshots for agent visual inspection.
 *
 * The agent runs this after making UI changes, then Reads the resulting
 * PNGs to *see* what it changed (the ui-verify skill drives this flow).
 * Screenshots land in .loop/screenshots/ (gitignored).
 *
 * Usage:
 *   node scripts/snap.mjs /login /tasks     # snapshot specific routes
 *   node scripts/snap.mjs                   # default: /login and /tasks
 *
 * Requires the dev server on http://localhost:3000 (pnpm dev).
 * Routes behind auth are captured after logging in with the seeded
 * demo user, so run `pnpm db:reset` first if the DB was modified.
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const BASE_URL = process.env.SNAP_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = ".loop/screenshots";
const PUBLIC_ROUTES = new Set(["/login", "/register"]);
const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/login", "/tasks"];

try {
  const res = await fetch(BASE_URL, { redirect: "manual" });
  if (res.status >= 500) throw new Error(`server returned ${res.status}`);
} catch {
  console.error(`✗ Dev server not reachable at ${BASE_URL} — start it with: pnpm dev`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  colorScheme: "light",
  locale: "en-US",
  timezoneId: "UTC",
  reducedMotion: "reduce",
});
const page = await context.newPage();

async function snap(route) {
  const file = `${OUT_DIR}/${route.replaceAll("/", "_").replace(/^_/, "") || "home"}.png`;
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: file, fullPage: true });
  console.log(`✓ ${route} → ${file}`);
}

// Public routes first: once logged in, the middleware redirects
// /login and /register to /tasks and we'd screenshot the wrong page.
for (const route of routes.filter((r) => PUBLIC_ROUTES.has(r))) {
  await snap(route);
}

const protectedRoutes = routes.filter((r) => !PUBLIC_ROUTES.has(r));
if (protectedRoutes.length > 0) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel("Email").fill("demo@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/tasks");
  for (const route of protectedRoutes) {
    await snap(route);
  }
}

await browser.close();
console.log("\nDone. Read the PNGs above to visually inspect the pages.");
