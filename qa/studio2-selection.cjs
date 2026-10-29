const { chromium } = require(
    process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright",
  ),
  assert = require("node:assert/strict"),
  fs = require("fs"),
  path = require("path");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001",
  out = process.env.SHOWSET_QA_OUTPUT || "qa-results/studio2-selection";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const c = await b.newContext({
        viewport: { width: 1440, height: 1000 },
        acceptDownloads: true,
      }),
      p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(base + "/studio/next/");
    const download = p.waitForEvent("download");
    await p.getByRole("button", { name: "Back up and start editing" }).click();
    await download;
    const f =
      p.frames().find((f) => f.url().includes("/studio/next/preview/")) ||
      (await p.waitForEvent("frameattached"));
    await p.frameLocator("iframe").locator(".hero-title").waitFor();
    await p
      .frameLocator("iframe")
      .getByRole("button", { name: "Edit image", exact: true })
      .first()
      .waitFor();
    const frameBox = await p.locator("iframe").boundingBox();
    const scale = frameBox.width / 1440;
    await p.mouse.click(frameBox.x + 1250 * scale, frameBox.y + 400 * scale);
    await p
      .getByRole("heading", { name: "Hero photograph", exact: true })
      .waitFor();
    await p.getByRole("button", { name: "Images", exact: true }).click();
    assert.ok(
      (await p.getByRole("button", { name: /^Edit image:/ }).count()) >= 7,
    );
    await p.screenshot({ path: path.join(out, "page-image-picker.png") });
    await p
      .getByRole("button", { name: "Edit image: Hero photograph", exact: true })
      .click();
    await p.getByRole("heading", { name: "Change this image" }).waitFor();
    await p
      .getByLabel("Replace image", { exact: false })
      .setInputFiles("public/media/planning.webp");
    await p.waitForFunction(() =>
      document
        .querySelector("iframe")
        ?.contentDocument?.querySelector("#hero-photo>img")
        ?.getAttribute("src")
        ?.startsWith("blob:"),
    );
    await p.getByRole("button", { name: "Layout", exact: true }).click();
    await p
      .frameLocator("iframe")
      .getByRole("button", { name: "Edit image", exact: true })
      .first()
      .click();
    await p.getByRole("heading", { name: "Change this image" }).waitFor();
    await p.screenshot({ path: path.join(out, "replace-image-controls.png") });
    const canvas = p.frameLocator("iframe");
    await canvas.locator(".desktop-navigation a").first().click();
    await p
      .getByRole("heading", { name: "Header navigation", exact: true })
      .waitFor();
    assert.equal(
      await canvas
        .locator(".concept-12-root")
        .getAttribute("data-concept-route"),
      "home",
    );
    await p
      .getByLabel("Link text", { exact: true })
      .first()
      .fill("Events editing test");
    await p.getByLabel("Link text", { exact: true }).first().blur();
    await canvas
      .locator(".desktop-navigation a")
      .first()
      .filter({ hasText: "Events editing test" })
      .waitFor();
    await p.screenshot({
      path: path.join(out, "navigation-editing-inert.png"),
    });
    await canvas.locator(".hero-links .solid-link").click();
    await p
      .getByRole("heading", { name: "Primary action", exact: true })
      .waitFor();
    await p
      .getByLabel("Link destination", { exact: true })
      .fill("/our-studio/");
    await p.getByLabel("Link destination", { exact: true }).blur();
    assert.equal(
      await canvas
        .locator(".concept-12-root")
        .getAttribute("data-concept-route"),
      "home",
    );
    await p.getByRole("button", { name: "Images", exact: true }).click();
    await p
      .getByRole("button", {
        name: "Edit image: Story scene 1 photograph",
        exact: true,
      })
      .click();
    await p
      .getByRole("heading", { name: "Story scene 1 photograph", exact: true })
      .waitFor();
    await p
      .getByLabel("Replace image", { exact: false })
      .setInputFiles("public/brand/approved-wordmark.png");
    const expected =
      "asset:asset-" +
      require("node:crypto")
        .createHash("sha256")
        .update(fs.readFileSync("public/brand/approved-wordmark.png"))
        .digest("hex");
    await p
      .getByText("Current file: approved-wordmark.png", { exact: true })
      .waitFor();
    await p.waitForFunction(() =>
      document
        .querySelector("iframe")
        ?.contentDocument?.querySelector('[data-film-image="0"] img')
        ?.getAttribute("src")
        ?.startsWith("blob:"),
    );
    await p.getByRole("button", { name: "Save draft", exact: true }).click();
    await p.waitForFunction(async (expected) => {
      const db = await new Promise((resolve, reject) => {
        const r = indexedDB.open("showset-studio2", 1);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      try {
        return await new Promise((resolve) => {
          const r = db
            .transaction("documents")
            .objectStore("documents")
            .get("draft");
          r.onsuccess = () =>
            resolve(
              r.result?.pages.home.sections.find((s) => s.type === "story")
                .items[0].image === expected,
            );
        });
      } finally {
        db.close();
      }
    }, expected);
    await p.reload();
    await p.getByRole("button", { name: "Images", exact: true }).click();
    await p
      .getByRole("button", {
        name: "Edit image: Story scene 1 photograph",
        exact: true,
      })
      .click();
    await p.waitForFunction(() =>
      document
        .querySelector("iframe")
        ?.contentDocument?.querySelector('[data-film-image="0"] img')
        ?.getAttribute("src")
        ?.startsWith("blob:"),
    );
    await canvas.locator(".desktop-navigation a").first().click();
    await p
      .getByRole("heading", { name: "Header navigation", exact: true })
      .waitFor();
    await canvas.locator("#mobile-toggle").evaluate((el) => el.click());
    assert.equal(
      await canvas.locator("#mobile-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await p
      .getByRole("button", { name: "Interactive preview", exact: true })
      .click();
    await canvas.locator(".desktop-navigation a").first().click();
    await p
      .getByRole("heading", { name: "Events & Experiences", exact: false })
      .first()
      .waitFor({ state: "visible", timeout: 1000 })
      .catch(() => {});
    await p.waitForFunction(() =>
      document
        .querySelector("iframe")
        ?.contentDocument?.querySelector('[data-concept-route="events"]'),
    );
    await p
      .getByRole("button", { name: "Return to editing", exact: true })
      .click();
    await canvas.locator(".desktop-navigation a").last().click();
    await p
      .getByRole("heading", { name: "Header navigation", exact: true })
      .waitFor();
    assert.equal(
      await canvas
        .locator(".concept-12-root")
        .getAttribute("data-concept-route"),
      "events",
    );
    assert.deepEqual(errors, []);
    await c.close();
    console.log(
      "PASS visible image picker/handles, hero and scene-image upload/reload, header/CTA editing without navigation, edit-mode toggle blocking and opt-in interactive navigation.",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
