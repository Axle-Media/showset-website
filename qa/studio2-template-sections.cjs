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
  // Selecting a different inspector target without changing the underlying
  // section must not unmount all its media, links and input state.
  await frame.locator(".s2-template-extensions > section.s2-node-section")
    .evaluate(node=>{window.__showsetOriginalSection=node;});
  assert.equal(await frame.locator(".s2-template-extensions").evaluate(
    e=>e.nextElementSibling?.classList.contains("service-close")),true);
  await p.getByRole("button",{name:"Select Heading",exact:true}).first().click();
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
  assert.equal(await frame.locator(".s2-template-extensions > section").count(),1);
  await p.getByRole("button",{name:"Show",exact:true}).click();
  assert.equal(await frame.locator(".s2-template-extensions > section").count(),2);
  await p.getByRole("button",{name:"Delete",exact:true}).click();
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
  assert.equal(await frame.locator(".s2-template-extensions").count(),0);
  await p.getByRole("button",{name:"+ Add editable section",exact:true}).click();
  await frame.locator(".case-experience .s2-template-extensions > section").waitFor();
  assert.equal(await frame.locator(".s2-template-extensions").evaluate(
    e=>e.nextElementSibling?.classList.contains("case-related")),true);
  assert.deepEqual(errors,[]);
  await ctx.close();
  console.log("PASS template sections add/edit/duplicate/reorder/hide/delete, phone styles, persistence and case insertion.");
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
