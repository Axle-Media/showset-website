const { chromium } = require(
    process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright",
  ),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001",
  out = process.env.SHOWSET_QA_OUTPUT || "qa-artifacts/studio2";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
      channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
      headless: true,
    }),
    c = await b.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
      recordVideo: {
        dir: path.join(out, "video"),
        size: { width: 1440, height: 1000 },
      },
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base);
  await p.evaluate(() =>
    localStorage.setItem(
      "showset-recovery-qa",
      '  Exact original recovery bytes — é\n{"keep":true}  ',
    ),
  );
  const original = await p.evaluate(() =>
    Object.fromEntries(
      Object.entries(localStorage).filter(([k]) => k.startsWith("showset-")),
    ),
  );
  await p.goto(base + "/studio/next/");
  await p.getByRole("button", { name: "Back up and start editing" }).waitFor();
  await p.screenshot({ path: path.join(out, "onboarding-1440.png") });
  let download = p.waitForEvent("download");
  await p.getByRole("button", { name: "Back up and start editing" }).click();
  const first = await download;
  await first.saveAs(path.join(out, "before-backup.json"));
  const backup = JSON.parse(
    fs.readFileSync(path.join(out, "before-backup.json"), "utf8"),
  );
  assert.deepEqual(backup.records, original);
  await p.getByRole("button", { name: "Save draft", exact: true }).waitFor();
  const nav = p
    .getByRole("navigation")
    .filter({ has: p.getByRole("button", { name: "Layers", exact: true }) })
    .first();
  const frame = () => p.frameLocator("iframe");
  await p
    .getByRole("button", { name: "Hero headline heading", exact: true })
    .click();
  const headline = p.getByLabel("Headline", { exact: true });
  await headline.fill("Ideas that matter");
  await headline.blur();
  await frame()
    .locator(".hero-title")
    .filter({ hasText: "Ideas that matter" })
    .waitFor();
  await p.getByRole("button", { name: "Typography", exact: true }).click();
  await p.getByLabel("Font size", { exact: true }).fill("72px");
  await p.getByLabel("Font size", { exact: true }).blur();
  await p.getByLabel("Line height", { exact: true }).fill("1.2");
  await p.getByLabel("Letter spacing", { exact: true }).fill(".02em");
  await p.getByLabel("Letter spacing", { exact: true }).blur();
  await p.getByRole("button", { name: "Mobile", exact: true }).click();
  await p.getByLabel("Font size", { exact: true }).fill("40px");
  await p.getByLabel("Font size", { exact: true }).blur();
  assert.equal(
    await frame()
      .locator(".hero-title")
      .evaluate((e) => getComputedStyle(e).fontSize),
    "40px",
  );
  await p.screenshot({ path: path.join(out, "hero-mobile-override.png") });
  await p.getByRole("button", { name: "Desktop", exact: true }).click();
  assert.equal(
    await frame()
      .locator(".hero-title")
      .evaluate((e) => getComputedStyle(e).fontSize),
    "72px",
  );
  await p
    .getByRole("button", { name: "Hero accent heading", exact: true })
    .click();
  await p.getByRole("button", { name: "Typography", exact: true }).click();
  await p.getByLabel("Accent colour", { exact: true }).fill("#E5D8C3");
  await p.getByLabel("Accent colour", { exact: true }).blur();
  await p.waitForFunction(() => {
    const f = document.querySelector("iframe");
    const e = f?.contentDocument?.querySelector(".hero-accent-phrase>span");
    return (
      e && f.contentWindow.getComputedStyle(e).color === "rgb(229, 216, 195)"
    );
  });
  await p.getByRole("button", { name: "Pages", exact: true }).first().click();
  await p.getByRole("button", { name: "+ New", exact: true }).click();
  await p.getByLabel("Page name", { exact: true }).last().fill("Builder QA");
  await p
    .getByLabel("Address after release", { exact: true })
    .last()
    .fill("/builder-qa/");
  await p.getByRole("button", { name: "Create page", exact: true }).click();
  await p.getByRole("button", { name: "Add a section", exact: true }).click();
  await p.getByRole("button", { name: "Add", exact: true }).first().click();
  await p.getByRole("button", { name: /^Container Arrange/ }).click();
  await p.getByRole("button", { name: "Add", exact: true }).first().click();
  await p.getByRole("button", { name: /^Heading A semantic/ }).click();
  await p.getByLabel("Headline", { exact: true }).fill("A working visual page");
  await p.getByLabel("Headline", { exact: true }).blur();
  await frame()
    .locator("h2")
    .filter({ hasText: "A working visual page" })
    .waitFor();
  await p.getByRole("button", { name: "Typography", exact: true }).click();
  await p.getByRole("button", { name: "Display", exact: true }).click();
  assert.equal(
    await p.getByLabel("Font size", { exact: true }).inputValue(),
    "64px",
  );
  assert.equal(
    await p.getByLabel("Line height", { exact: true }).inputValue(),
    "1.08",
  );
  await p.getByRole("button", { name: "Select Section", exact: true }).click();
  await p.getByRole("button", { name: "Background", exact: true }).click();
  await p
    .getByRole("button", {
      name: "Restore approved closing CTA pattern",
      exact: true,
    })
    .click();
  assert.equal(
    await frame()
      .locator(".s2-node-section")
      .evaluate((e) => getComputedStyle(e, "::before").opacity),
    "0.42",
  );
  await p.getByRole("button", { name: "Add", exact: true }).first().click();
  await p.getByRole("button", { name: /^Image A photograph/ }).click();
  await p
    .getByLabel("Replace image", { exact: false })
    .setInputFiles("public/media/planning.webp");
  await frame().locator(".s2-node-image img").waitFor();
  await p.getByRole("button", { name: "Layout", exact: true }).click();
  await p.getByLabel("Focal position", { exact: true }).fill("20% 40%");
  await p.getByLabel("Focal position", { exact: true }).blur();
  await p.getByRole("button", { name: "Mobile", exact: true }).click();
  await p.getByLabel("Focal position", { exact: true }).fill("70% 40%");
  await p.getByLabel("Focal position", { exact: true }).blur();
  assert.equal(
    await frame()
      .locator(".s2-node-section")
      .evaluate((e) => getComputedStyle(e, "::before").opacity),
    "0.24",
  );
  await p.getByRole("button", { name: "Save draft", exact: true }).click();
  await p.waitForTimeout(1000);
  await p.reload();
  await p.getByRole("button", { name: "Pages", exact: true }).first().click();
  await p.getByRole("button", { name: /Builder QA.*builder-qa/ }).click();
  await frame()
    .locator("h2")
    .filter({ hasText: "A working visual page" })
    .waitFor();
  assert.equal(
    await frame()
      .locator(".s2-node-image img")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
    true,
  );
  await p
    .getByRole("button", { name: "Save local preview", exact: false })
    .click();
  await p.waitForTimeout(1200);
  const preview = await c.newPage();
  await preview.goto(base + "/studio/next/preview/?page=builder-qa");
  await preview
    .locator("h2")
    .filter({ hasText: "A working visual page" })
    .waitFor();
  assert.equal(
    await preview
      .locator(".s2-node-image img")
      .evaluate((e) => e.complete && e.naturalWidth > 0),
    true,
  );
  await preview.screenshot({ path: path.join(out, "saved-preview-1440.png") });
  await preview.close();
  await p.getByRole("button", { name: "Site", exact: true }).first().click();
  download = p.waitForEvent("download");
  await p
    .getByRole("button", { name: "Download verified backup", exact: true })
    .click();
  await (await download).saveAs(path.join(out, "portable-backup.json"));
  const portable = JSON.parse(
    fs.readFileSync(path.join(out, "portable-backup.json"), "utf8"),
  );
  assert.equal(portable.assets.length, 1);
  assert.ok(portable.assets[0].base64.length > 0);
  assert.deepEqual(
    await p.evaluate(() =>
      Object.fromEntries(
        Object.entries(localStorage).filter(([k]) => k.startsWith("showset-")),
      ),
    ),
    original,
  );
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.waitForTimeout(150);
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `Studio overflow ${width}`,
    );
    await p.screenshot({ path: path.join(out, "workspace-" + width + ".png") });
  }
  assert.deepEqual(errors, []);
  await c.close();
  await b.close();
  console.log(
    "PASS Studio 2.0: backup preservation, hero responsive type, blank page nesting, pattern, upload/crop, save/reload/preview, portable backup, six widths; no page errors.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
