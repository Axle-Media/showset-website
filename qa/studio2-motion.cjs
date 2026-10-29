const { chromium } = require(
    process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright",
  ),
  fs = require("fs"),
  path = require("path"),
  assert = require("node:assert/strict");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001",
  out = process.env.SHOWSET_QA_OUTPUT || "qa-results/studio2";
(async () => {
  const b = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const c = await b.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
        recordVideo: {
          dir: path.join(out, "motion-video"),
          size: { width: 1440, height: 1000 },
        },
      }),
      p = await c.newPage();
    await p.goto(base + "/studio/next/");
    let d = p.waitForEvent("download");
    await p.getByRole("button", { name: "Back up and start editing" }).click();
    await d;
    await p.getByRole("button", { name: "Site", exact: true }).first().click();
    d = p.waitForEvent("download");
    await p
      .locator('input[accept="application/json"]')
      .setInputFiles(path.join(out, "portable-backup.json"));
    await d;
    await p.getByRole("button", { name: "Pages", exact: true }).first().click();
    await p.getByRole("button", { name: /Builder QA.*builder-qa/ }).click();
    await p
      .getByRole("button", { name: "Select Section", exact: true })
      .click();
    await p.getByRole("button", { name: "Add", exact: true }).first().click();
    await p.getByRole("button", { name: /^Spacer Controlled/ }).click();
    await p.getByRole("button", { name: "Layout", exact: true }).click();
    await p.getByLabel("Height", { exact: true }).fill("1400px");
    await p.getByLabel("Height", { exact: true }).blur();
    await p.getByRole("button", { name: "Move up", exact: true }).click();
    await p.getByRole("button", { name: "Move up", exact: true }).click();
    await p
      .getByRole("button", { name: "Select Heading", exact: true })
      .click();
    await p.getByLabel("Headline", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Motion", exact: true }).click();
    console.log(
      "Motion panel:",
      (
        await p
          .getByRole("complementary", { name: "Element inspector" })
          .innerText()
      ).slice(0, 700),
    );
    await p.getByLabel("Motion preset", { exact: true }).selectOption("reveal");
    await p.getByLabel("Trigger", { exact: true }).selectOption("scroll");

    await p
      .getByRole("button", { name: "Interactive preview", exact: true })
      .click();
    const f = p.frames().find((f) => f.url().includes("/studio/next/preview/"));
    const heading = f.locator(".s2-node-heading");
    await f.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(150);
    const first = await heading.evaluate((e) => getComputedStyle(e).clipPath);
    assert.ok(first.includes("100%"), first);
    await heading.evaluate((e) => {
      let y = 0;
      for (let t = e; t; t = t.offsetParent) y += t.offsetTop;
      scrollTo({ top: y - 100, behavior: "instant" });
    });
    await p.waitForTimeout(200);
    const forward = await heading.evaluate((e) => getComputedStyle(e).clipPath);
    assert.ok(!forward.includes("100%"), forward);
    await p.screenshot({ path: path.join(out, "motion-forward.png") });
    await f.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(180);
    assert.equal(
      await heading.evaluate((e) => getComputedStyle(e).clipPath),
      first,
    );
    await p.screenshot({ path: path.join(out, "motion-reverse.png") });
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.waitForTimeout(180);
    assert.equal(
      await heading.evaluate((e) => getComputedStyle(e).clipPath),
      "none",
    );
    assert.equal(
      await heading.evaluate((e) => getComputedStyle(e).opacity),
      "1",
    );
    await p.emulateMedia({ reducedMotion: "no-preference" });
    await p
      .getByRole("button", { name: "Return to editing", exact: true })
      .click();
    await p.getByRole("button", { name: "Background", exact: true }).click();
    await p.getByLabel("Element opacity", { exact: true }).fill(".6");
    await p.getByLabel("Element opacity", { exact: true }).blur();
    await p.getByRole("button", { name: "Motion", exact: true }).click();
    await p.getByLabel("Motion preset", { exact: true }).selectOption("fade");
    await p
      .getByRole("button", { name: "Interactive preview", exact: true })
      .click();
    await f.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await p.waitForTimeout(150);
    assert.equal(
      await heading.evaluate((e) => getComputedStyle(e).opacity),
      "0",
    );
    await heading.evaluate((e) => {
      let y = 0;
      for (let t = e; t; t = t.offsetParent) y += t.offsetTop;
      scrollTo({ top: y - 100, behavior: "instant" });
    });
    await p.waitForTimeout(180);
    assert.equal(
      await heading.evaluate((e) => getComputedStyle(e).opacity),
      "0.6",
    );
    await p
      .getByRole("button", { name: "Return to editing", exact: true })
      .click();
    await p.getByRole("button", { name: "Content", exact: true }).click();
    await p.getByLabel("Headline", { exact: true }).fill("Undo this text");
    await p.getByLabel("Headline", { exact: true }).blur();
    await p.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(
      await p.getByLabel("Headline", { exact: true }).inputValue(),
      "A working visual page",
    );
    await p.getByRole("button", { name: "Redo", exact: true }).click();
    assert.equal(
      await p.getByLabel("Headline", { exact: true }).inputValue(),
      "Undo this text",
    );
    await p.getByRole("button", { name: "Lock", exact: true }).click();
    assert.equal(
      await p.getByLabel("Headline", { exact: true }).isDisabled(),
      true,
    );
    await heading.dblclick();
    assert.equal(await f.locator("[data-inline-editing]").count(), 0);
    await p.getByRole("button", { name: "Unlock", exact: true }).click();
    await p.getByRole("button", { name: "Duplicate", exact: true }).click();
    assert.equal(await f.locator(".s2-node-heading").count(), 2);
    await p
      .getByRole("button", { name: "Select Heading copy", exact: true })
      .dragTo(p.getByRole("button", { name: "Select Container", exact: true }));
    assert.equal(
      await f.locator(".s2-node-container .s2-node-heading").count(),
      2,
    );

    await p.getByRole("button", { name: "Delete", exact: true }).click();
    assert.equal(await f.locator(".s2-node-heading").count(), 1);
    await p.setViewportSize({ width: 390, height: 844 });
    await p.getByRole("button", { name: "Inspector", exact: true }).click();
    assert.equal(
      await p.getByRole("complementary", { name: "Page settings" }).isVisible(),
      true,
    );
    await p
      .getByRole("button", { name: "Layers", exact: true })
      .first()
      .click();
    assert.equal(
      await p
        .getByRole("complementary", { name: "Workspace navigator" })
        .isVisible(),
      true,
    );
    await c.close();
    console.log(
      "PASS reversible scroll motion, live OS reduced-motion fallback, undo/redo, lock/inline protection, duplicate/delete and mobile panel controls.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
