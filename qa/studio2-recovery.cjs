const { chromium } = require(
  process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright",
);
const fs = require("fs"),
  assert = require("node:assert/strict"),
  path = require("path");
const out = process.env.SHOWSET_QA_OUTPUT || "qa-results/studio2",
  base = process.env.SHOWSET_BASE_URL || "http://localhost:3001";
(async () => {
  const b = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const context = await b.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
      }),
      p = await context.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "/studio/next/");
    let d = p.waitForEvent("download");
    await p.getByRole("button", { name: "Back up and start editing" }).click();
    await d;
    await p.getByRole("button", { name: "Site", exact: true }).first().click();
    await p
      .locator('input[accept="application/json"]')
      .setInputFiles(path.join(out, "portable-backup.json"));
    await p.waitForEvent("download");
    await p.getByRole("button", { name: "Pages", exact: true }).first().click();
    await p.getByRole("button", { name: /Builder QA.*builder-qa/ }).click();
    await p.frameLocator("iframe").locator(".s2-node-image img").waitFor();
    await p.waitForTimeout(500);
    assert.ok(
      await p
        .frameLocator("iframe")
        .locator(".s2-node-image img")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    );
    await p
      .getByRole("button", { name: "Select Heading", exact: true })
      .click();
    const f = p.frames().find((f) => f.url().includes("/studio/next/preview/"));
    await f.locator(".s2-node-heading").dblclick();
    await f
      .locator("[contenteditable=true]")
      .fill("Inline editing survives reload");
    await f.locator("[contenteditable=true]").press("Enter");
    await p.waitForTimeout(900);
    await p.reload();
    await p.getByRole("button", { name: "Pages", exact: true }).first().click();
    await p.getByRole("button", { name: /Builder QA.*builder-qa/ }).click();
    await p
      .frameLocator("iframe")
      .locator("h2")
      .filter({ hasText: "Inline editing survives reload" })
      .waitFor();
    await p.getByRole("button", { name: "Save local preview" }).click();
    await p.waitForTimeout(900);
    const second = await context.newPage();
    await second.goto(base + "/studio/next/");
    await second
      .getByRole("button", { name: "Hero headline heading", exact: true })
      .click();
    await second.getByLabel("Headline", { exact: true }).waitFor();
    await p.getByRole("button", { name: "Pages", exact: true }).first().click();
    await p
      .getByRole("button", { name: /SHOWSET \| Events.*\/$/ })
      .first()
      .click();
    await p
      .getByRole("button", { name: "Hero headline heading", exact: true })
      .click();
    await p
      .getByLabel("Headline", { exact: true })
      .fill("Tab one owns this revision");
    await p.getByLabel("Headline", { exact: true }).blur();
    await p.waitForTimeout(1100);
    await second
      .getByLabel("Headline", { exact: true })
      .fill("Tab two should conflict");
    await second.getByLabel("Headline", { exact: true }).blur();
    await second
      .getByRole("button", { name: "Back up and load latest" })
      .waitFor();
    assert.ok(
      (await second.locator("body").innerText()).includes(
        "have not overwritten",
      ),
    );
    await second.screenshot({
      path: path.join(out, "conflict-protection.png"),
    });
    d = second.waitForEvent("download");
    await second
      .getByRole("button", { name: "Back up and load latest" })
      .click();
    await d;
    await second.waitForFunction(
      () =>
        document.querySelector("input") &&
        [...document.querySelectorAll("label")].some(
          (l) =>
            l.textContent === "Headline" &&
            l.querySelector("input")?.value === "Tab one owns this revision",
        ),
    );
    assert.equal(
      await second.getByLabel("Headline", { exact: true }).inputValue(),
      "Tab one owns this revision",
    );
    // Bad checksum is rejected without replacing the current workspace.
    const corrupt = JSON.parse(
      fs.readFileSync(path.join(out, "portable-backup.json"), "utf8"),
    );
    corrupt.workspace.pages.home.title = "Tampered";
    await second
      .getByRole("button", { name: "Site", exact: true })
      .first()
      .click();
    await second
      .locator('input[accept="application/json"]')
      .setInputFiles({
        name: "tampered.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(corrupt)),
      });
    await second
      .getByRole("alert")
      .filter({ hasText: "checksum does not match" })
      .waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    console.log(
      "PASS portable media import into fresh browser; real inline edit and reload; two-tab CAS conflict; backup-before-recovery; tampered backup rejected.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
