const { chromium } = require(
    process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright",
  ),
  assert = require("node:assert/strict"),
  fs = require("fs"),
  path = require("path");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001",
  out = process.env.SHOWSET_QA_OUTPUT || "qa-results/studio2";
(async () => {
  const b = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const c = await b.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        acceptDownloads: true,
      }),
      p = await c.newPage();
    await p.goto(base + "/studio/next/");
    const download = p.waitForEvent("download");
    await p.getByRole("button", { name: "Back up and start editing" }).tap();
    await download;
    // A phone must default to its own editing breakpoint, not a scaled-down
    // 1440px desktop canvas with tiny unreadable text.
    await p.waitForFunction(() =>
      document.querySelector('input[aria-label="Canvas viewport width"]')?.value === "390",
    );
    assert.equal(
      await p.getByRole("button", { name: "Mobile", exact: true }).getAttribute("aria-pressed"),
      "true",
    );
    await p.getByRole("button", { name: "Layers", exact: true }).first().tap();
    await p
      .getByRole("button", { name: "Hero headline heading", exact: true })
      .tap();
    await p.getByRole("button", { name: "Content", exact: true }).waitFor();
    await p.getByLabel("Headline", { exact: true }).fill("Touch editing works");
    await p.getByLabel("Headline", { exact: true }).blur();
    await p.getByRole("button", { name: "Canvas", exact: true }).tap();
    await p
      .frameLocator("iframe")
      .locator(".hero-title")
      .filter({ hasText: "Touch editing works" })
      .waitFor();
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await p.screenshot({ path: path.join(out, "touch-editing-390.png") });
    await p.getByRole("button", { name: "Mobile", exact: true }).tap();
    await p
      .getByRole("button", { name: "Interactive preview", exact: true })
      .tap();
    const frame = p.frameLocator("iframe");
    await frame.getByRole("button", { name: "Open menu", exact: true }).tap();
    assert.equal(
      await frame.locator("#mobile-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await frame.locator("#mobile-toggle").press("Escape");
    assert.equal(
      await frame.locator("#mobile-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await c.close();
    console.log(
      "PASS actual touch-emulated Studio panels, headline editing, overflow and interactive mobile menu/Escape.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
