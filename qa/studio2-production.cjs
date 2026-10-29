const { chromium } = require(
    process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright",
  ),
  assert = require("node:assert/strict");
const base = process.env.SHOWSET_PRODUCTION_URL || "http://127.0.0.1:3004",
  pages = require("../content/pages.json");
(async () => {
  const browser = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false }),
      page = await context.newPage();
    for (const record of Object.values(pages)) {
      const response = await page.goto(base + record.route);
      assert.equal(response.status(), 200, record.route);
      assert.equal(await page.locator("h1").count(), 1, record.route);
      assert.ok(
        await page.locator("meta[name=description]").getAttribute("content"),
        record.route,
      );
      assert.ok(await page.locator("title").innerText(), record.route);
    }
    for (const route of ["/studio/next/", "/studio/next/preview/"]) {
      await page.goto(base + route);
      assert.equal(
        await page
          .getByRole("heading", { name: "Private editing workspace" })
          .count(),
        1,
      );
      assert.equal(await page.getByRole("button").count(), 0);
      assert.ok(
        (
          await page.locator("meta[name=robots]").getAttribute("content")
        ).includes("noindex"),
      );
    }
    await context.close();
    console.log(
      "PASS 12 direct static routes and SEO without JavaScript; Studio 2.0 fails closed in production export even on localhost.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
