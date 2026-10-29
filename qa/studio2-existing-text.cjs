const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001";

(async () => {
  const browser = await chromium.launch({
    channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 }, acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/studio/next/");
    const d = page.waitForEvent("download");
    await page.getByRole("button", {name:"Back up and start editing"}).click();
    await d;
    const frame = page.frameLocator("iframe");

    const selectPage = async (route) => {
      await page.getByRole("button",{name:"Pages",exact:true}).first().click();
      await page.locator(".s2-page-list button").filter({hasText:route}).click();
      await page.getByRole("button",{name:"Layers",exact:true}).first().click();
    };
    const selectBinding = async (name) => {
      await page.locator(".s2-navigator .s2-page-list button")
        .filter({hasText:name}).first().click();
    };
    const edit = async (label, value) => {
      const field = page.getByLabel(label,{exact:true}).first();
      await field.fill(value);
      await field.blur();
    };
    await selectPage("/events-experiences/");
    await selectBinding("Section heading");
    assert.ok(await page.getByLabel("Headline",{exact:true}).isVisible());
    // Multiple section-heading controls exist: choose a stage title by its
    // distinct name and ensure it affects the real service renderer.
    await selectBinding("Stage 1: heading");
    await edit("Headline", "A new stage headline.");
    await frame.locator('[data-service-scene="0"] h3')
      .filter({hasText:"A new stage headline."}).waitFor();
    await selectBinding("Stage 1: paragraph");
    await edit("Text", "Stage description saved through Studio 2.");
    await frame.locator('[data-service-scene="0"] p')
      .filter({hasText:"Stage description saved through Studio 2."}).waitFor();

    // Capability names are grouped by the service renderer. The editor must
    // target their original item records, not the rendered group index.
    await selectBinding("Capability:");
    await edit("Text", "New event capability.");
    await frame.locator(".service-capability-name")
      .filter({hasText:"New event capability."}).waitFor();

    await selectPage("/our-studio/");
    await selectBinding("Section heading");
    await edit("Headline", "Curious minds make more.");
    await frame.locator(".studio-hero-scene-first h1")
      .filter({hasText:"Curious minds make more."}).waitFor();

    await selectPage("/work/made-to-be-remembered/");
    await selectBinding("Opening headline");
    await edit("Headline", "A story with lasting impact.");
    await frame.locator(".case-opening-first .case-scene-copy h1")
      .filter({hasText:"A story with lasting impact."}).waitFor();
    await selectBinding("Brief body");
    await edit("Text", "A well-defined brief, carefully considered.");
    await frame.locator('[data-case-chapter="0"] .case-body-copy p')
      .filter({hasText:"A well-defined brief, carefully considered."}).waitFor();

    await page.getByRole("button",{name:"Save draft",exact:true}).click();
    await page.waitForFunction(async () => {
      const db = await new Promise((resolve,reject)=>{
        const r=indexedDB.open("showset-studio2",1);
        r.onsuccess=()=>resolve(r.result);
        r.onerror=()=>reject(r.error);
      });
      try {
        return await new Promise((resolve)=>{
          const q=db.transaction("documents").objectStore("documents").get("draft");
          q.onsuccess=()=>{
            const w=q.result;
            const service=w?.pages?.["events-experiences"];
            const stage=service?.sections.find(x=>x.id==="service-story")?.items?.[0];
            const caseStudy=w?.pages?.["made-to-be-remembered"]?.caseExperience;
            resolve(stage?.title==="A new stage headline." &&
              stage?.description==="Stage description saved through Studio 2." &&
              caseStudy?.openingTitle==="A story with lasting impact." &&
              caseStudy?.brief?.body==="A well-defined brief, carefully considered.");
          };
        });
      } finally {db.close();}
    });
    await page.reload();
    await selectPage("/work/made-to-be-remembered/");
    await frame.locator(".case-opening-first .case-scene-copy h1")
      .filter({hasText:"A story with lasting impact."}).waitFor();
    await selectPage("/events-experiences/");
    await frame.locator('[data-service-scene="0"] h3')
      .filter({hasText:"A new stage headline."}).waitFor();
    assert.deepEqual(errors,[]);
    await context.close();
    console.log("PASS existing service, capability, Studio and case copy editing updates canonical source and persists.");
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
