const { chromium } = require(process.env.SHOWSET_PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const base = process.env.SHOWSET_BASE_URL || "http://localhost:3001";
(async () => {
 const browser = await chromium.launch({
   channel: process.env.SHOWSET_PLAYWRIGHT_CHANNEL || "chrome",headless:true
 });
 try {
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  const p=await ctx.newPage(),errors=[];
  p.on("pageerror",e=>errors.push(e.message));
  await p.goto(base+"/studio/next/");
  const download=p.waitForEvent("download");
  await p.getByRole("button",{name:"Back up and start editing"}).click();
  await download;
  const frame=p.frameLocator("iframe");
  const choose=async route=>{
    await p.getByRole("button",{name:"Pages",exact:true}).first().click();
    await p.locator(".s2-page-list button").filter({hasText:route}).click();
  };
  await choose("/events-experiences/");
  assert.equal(await frame.locator(".service-hero").count(),1);
  assert.equal(await frame.locator(".s2-template-extensions").count(),0);
  await p.getByRole("button",{name:"+ Add editable section",exact:true}).click();
  await frame.locator(".s2-template-extensions > section.s2-node-section").waitFor();
  // The cinematic route mounts asynchronously; first allow its initial
  // refresh to settle, then check stability across an inspector-only change.
  await p.waitForTimeout(900);
  // Selecting a different inspector target without changing the underlying
  // section must not unmount all its media, links and input state.
  await frame.locator(".s2-template-extensions > section.s2-node-section")
    .evaluate(node=>{window.__showsetOriginalSection=node;});
  assert.equal(await frame.locator(".s2-template-extensions").evaluate(
    e=>e.nextElementSibling?.classList.contains("service-close")),true);
  await p.getByRole("button",{name:"Select Heading",exact:true}).first().click();
  // The template inspector re-syncs on selection. It must not remove the
  // separate stylesheet generated for owner-authored builder content.
  await p.waitForTimeout(200);
  assert.equal(await frame.locator(
    ".s2-template-extensions style[data-studio2-builder-style]").count(),1,
    "Selecting an element must not strip authored CSS");
  assert.equal(await frame.locator(".s2-template-extensions > section.s2-node-section")
    .evaluate(node=>node===window.__showsetOriginalSection),true,
    "selection must preserve existing section DOM");
  await p.getByLabel("Headline",{exact:true}).fill("The next event idea.");
  await p.getByLabel("Headline",{exact:true}).blur();
  await frame.locator(".s2-template-extensions .s2-node-heading")
    .filter({hasText:"The next event idea."}).waitFor();
  await p.getByRole("button",{name:"Select Editable section",exact:true}).click();
  await p.getByRole("button",{name:"Duplicate",exact:true}).click();
  assert.equal(await frame.locator(".s2-template-extensions > section").count(),2);
  await p.getByRole("button",{name:"Select Editable section copy",exact:true}).click();
  await p.getByRole("button",{name:"Move up",exact:true}).click();
  assert.equal(new Set(await frame.locator(".s2-template-extensions > section").evaluateAll(
    nodes=>nodes.map(n=>n.dataset.builderNode))).size,2);
  await p.getByRole("button",{name:"Hide",exact:true}).click();
  await p.waitForFunction(()=>
    document.querySelector("iframe")?.contentDocument
      ?.querySelectorAll(".s2-template-extensions > section").length===1);
  assert.equal(await frame.locator(".s2-template-extensions > section").count(),1);
  await p.getByRole("button",{name:"Show",exact:true}).click();
  await p.waitForFunction(()=>
    document.querySelector("iframe")?.contentDocument
      ?.querySelectorAll(".s2-template-extensions > section").length===2);
  assert.equal(await frame.locator(".s2-template-extensions > section").count(),2);
  await p.getByRole("button",{name:"Delete",exact:true}).click();
  await p.waitForFunction(()=>
    document.querySelector("iframe")?.contentDocument
      ?.querySelectorAll(".s2-template-extensions > section").length===1);
  assert.equal(await frame.locator(".s2-template-extensions > section").count(),1);
  await p.getByRole("button",{name:"Mobile",exact:true}).click();
  assert.equal(await frame.locator(".s2-template-extensions > section").evaluate(
    el=>getComputedStyle(el).textAlign),"center");
  await p.getByRole("button",{name:"Save draft",exact:true}).click();
  await p.waitForFunction(async()=>{
    const db=await new Promise((resolve,reject)=>{
      const r=indexedDB.open("showset-studio2",1);
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
    });
    try{return await new Promise(resolve=>{
      const q=db.transaction("documents").objectStore("documents").get("draft");
      q.onsuccess=()=>{
        const roots=q.result?.pages?.["events-experiences"]?.builder?.roots;
        resolve(roots?.length===1 &&
          roots[0].children.some(n=>n.props.text==="The next event idea."));
      };
    });}finally{db.close();}
  });
  await p.reload();
  await choose("/events-experiences/");
  await frame.locator(".s2-template-extensions .s2-node-heading")
    .filter({hasText:"The next event idea."}).waitFor();
  await choose("/work/made-to-be-remembered/");
  // Canvas messages are asynchronous: assert after the real case view is
  // mounted, not while the previous service view is still transitioning.
  await frame.locator(".case-experience").waitFor();
  await p.waitForFunction(()=>{
    const doc=document.querySelector("iframe")?.contentDocument;
    return doc?.querySelector(".case-experience") &&
      !doc?.querySelector(".view[data-view='service'].is-current") &&
      !doc?.querySelector(".case-experience .s2-template-extensions");
  });
  await p.getByRole("button",{name:"+ Add editable section",exact:true}).click();
  await frame.locator(".case-experience .s2-template-extensions > section").waitFor();
  assert.equal(await frame.locator(".s2-template-extensions").evaluate(
    e=>e.nextElementSibling?.classList.contains("case-related")),true);
  // A branded editorial layout can be added to an existing service without
  // replacing its approved scenes, saved as a template and reused separately.
  await choose("/events-experiences/");
  await p.getByRole("button",{name:"Sections",exact:true}).click();
  await p.getByRole("button",{name:/Editorial split/}).click();
  await frame.locator(".s2-template-extensions .s2-node-container").first().waitFor();
  const originalIds=await frame.locator(".s2-template-extensions > section")
    .evaluateAll(elements=>elements.map(e=>e.dataset.builderNode));
  p.once("dialog",dialog=>dialog.accept("Reusable editorial QA"));
  await p.getByRole("button",{name:"Save to section library"}).click();
  await p.getByText("Reusable editorial QA",{exact:true}).waitFor();
  await p.getByRole("button",{name:"Insert copy"}).click();
  await p.waitForFunction(expected=>{
    const sections=document.querySelector("iframe")?.contentDocument
      ?.querySelectorAll(".s2-template-extensions > section");
    return !!sections && sections.length===expected+1;
  },originalIds.length);
  const reusedIds=await frame.locator(".s2-template-extensions > section")
    .evaluateAll(elements=>elements.map(e=>e.dataset.builderNode));
  assert.equal(new Set(reusedIds).size,reusedIds.length,
    "Reused sections must have their own builder IDs");
  assert.ok(reusedIds.some(id=>!originalIds.includes(id)));

  // Every gallery item can be uploaded, given accessible copy and reordered.
  await p.getByRole("button",{name:"Sections",exact:true}).click();
  await p.getByRole("button",{name:/Photo gallery/}).click();
  await p.getByRole("button",{name:"Select Editable photo gallery"}).click();
  await p.locator('.s2-inspector-fields input[type="file"]').first()
    .setInputFiles("public/media/planning.webp");
  await p.waitForFunction(()=>{
    const gallery=document.querySelector("iframe")?.contentDocument
      ?.querySelector(".s2-node-gallery img");
    return !!gallery && gallery.getAttribute("src")?.startsWith("blob:");
  });
  await p.getByLabel("Caption",{exact:true}).first().fill("First moment");
  await p.getByLabel("Caption",{exact:true}).first().blur();
  await p.getByRole("button",{name:"Move item down"}).first().click();
  await frame.locator(".s2-node-gallery figcaption").filter({hasText:"First moment"}).waitFor();
  assert.equal(await frame.locator(".s2-node-gallery figure").count(),3);
  assert.equal(await frame.locator(".s2-node-gallery figure").nth(1)
    .locator("figcaption").innerText(),"First moment");
  await p.getByRole("button",{name:"Save draft",exact:true}).click();
  await p.waitForTimeout(1000);
  await p.reload();
  await choose("/events-experiences/");
  await frame.locator(".s2-node-gallery figure").nth(1)
    .locator("figcaption").filter({hasText:"First moment"}).waitFor();
  await p.getByRole("button",{name:"Sections",exact:true}).click();
  await p.getByText("Reusable editorial QA",{exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  await ctx.close();
  console.log("PASS template sections, responsive presets, reusable independent copies, gallery original upload/reorder/captions, persistence and case insertion.");
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
