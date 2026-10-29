const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001";
const fixture = require("node:path").resolve("public/brand/approved-wordmark.png");

(async () => {
  const browser = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/studio/next/");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Back up and start editing" }).click();
    await download;
    const iframe = page.frameLocator("iframe");
    const choosePage = async (route) => {
      await page.getByRole("button", { name: "Pages", exact: true }).first().click();
      await page.locator(".s2-page-list button").filter({ hasText: route }).click();
      await page.getByRole("button", { name: "Images", exact: true }).first().click();
    };
    const replace = async (name, selector) => {
      await page.getByRole("button", { name }).click();
      await page.getByRole("heading", { name: "Change this image" }).waitFor();
      await page.getByLabel("Replace image", { exact: false }).setInputFiles(fixture);
      await page.waitForFunction((selector) => {
        const doc = document.querySelector("iframe")?.contentDocument;
        const images = [...(doc?.querySelectorAll(selector) || [])];
        return images.length > 0 && images.every((image) =>
          image.getAttribute("src")?.startsWith("blob:")
        );
      }, selector);
    };
    await choosePage("/events-experiences/");
    assert.equal(await page.getByRole("button", {name: /^Edit image:/}).count(), 4);
    await replace("Edit image: Hero photograph", ".service-hero-art img");
    await replace(
      "Edit image: Stage 1: First, the possibility.",
      ".service-event-triptych-image:nth-child(1) img"
    );
    await choosePage("/digital-marketing/");
    assert.equal(await page.getByRole("button", {name: /^Edit image:/}).count(), 4);
    await replace(
      "Edit image: Stage 1: A place worth landing.",
      '[data-production-frame="0"] img'
    );
    await choosePage("/our-studio/");
    assert.equal(await page.getByRole("button", {name: /^Edit image:/}).count(), 4);
    await replace("Edit image: Studio chapter 2 photograph", '[data-studio-shot="1"] img');
    await choosePage("/our-work/");
    assert.equal(await page.getByRole("button", {name: /^Edit image:/}).count(), 1);
    await replace("Edit image: Our Work hero photograph", ".work-hero .simple-bg img");
    await choosePage("/work/made-to-be-remembered/");
    assert.equal(await page.getByRole("button", {name: /^Edit image:/}).count(), 8);
    await replace(
      "Edit image: Brief chapter photograph",
      '[data-case-chapter="0"] .case-chapter-photo img, [data-case-story-image="0"] img'
    );
    await replace("Edit image: Gallery photograph 2", '[data-case-image="1"] img');
    await replace("Edit image: Opening photograph", ".case-opening-first > img");
    // Portfolio cards use the linked case's photograph as their only owner.
    await choosePage("/our-work/");
    await page.waitForFunction(() =>
      document.querySelector("iframe")?.contentDocument
        ?.querySelector('a[href="/work/made-to-be-remembered/"] img')
        ?.getAttribute("src")?.startsWith("blob:")
    );
    await choosePage("/work/made-to-be-remembered/");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Saved locally", { exact: true }).first().waitFor();
    await page.reload();
    await choosePage("/work/made-to-be-remembered/");
    assert.equal(await page.getByRole("button", {name: /^Edit image:/}).count(), 8);
    await page.waitForFunction(() => {
      const doc = document.querySelector("iframe")?.contentDocument;
      const chapter = [...(doc?.querySelectorAll('[data-case-chapter="0"] .case-chapter-photo img, [data-case-story-image="0"] img') || [])];
      const gallery = doc?.querySelector('[data-case-image="1"] img');
      return chapter.length === 2 &&
        chapter.every(i => i.getAttribute("src")?.startsWith("blob:")) &&
        gallery?.getAttribute("src")?.startsWith("blob:");
    });
    assert.deepEqual(errors, []);
    await context.close();
    console.log("PASS canonical service, Studio, Work and case image selection, upload, mirrored chapter, gallery persistence and reload.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
