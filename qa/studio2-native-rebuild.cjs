const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||"playwright");
const assert=require("node:assert/strict");
const base=process.env.SHOWSET_BASE_URL||"http://localhost:3001";
(async()=>{
  const browser=await chromium.launch({
    channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||"chrome",headless:true,
  });
  try{
    const context=await browser.newContext({
      viewport:{width:1440,height:1000},acceptDownloads:true
    });
    const p=await context.newPage(),errors=[];
    p.on("pageerror",e=>errors.push(e.message));
    await p.goto(base+"/studio/next/");
    const download=p.waitForEvent("download");
    await p.getByRole("button",{name:"Back up and start editing"}).click();
    await download;
    const frame=p.frameLocator("iframe");
    await p.getByRole("button",{name:"Pages",exact:true}).first().click();
    await p.locator(".s2-page-list button")
      .filter({hasText:"/events-experiences/"}).click();
    await p.getByRole("button",{name:"Layers",exact:true}).first().click();
    await p.getByRole("button",{name:/Introduction section/}).first().click();
    await p.getByRole("button",{name:"Rebuild as editable section"}).click();
    const rebuilt=frame.locator(".s2-template-extensions > section");
    await rebuilt.waitFor();
    assert.equal(await rebuilt.count(),1);
    const replacement=frame.locator('[data-studio2-native-extension="section-2"]');
    assert.equal(await replacement.evaluate(el=>{
      const next=el.nextElementSibling;
      return next?.dataset.serviceSection==="section-2"||
        next?.dataset.section==="section-2";
    }),true,"Rebuilt intro must render directly before its own native anchor");
    assert.equal(await frame.locator('[data-studio2-template-extensions="true"]').count(),0,
      "A native replacement must not be appended to the closing CTA");
    assert.equal(await frame.locator(".service-intro").evaluate(el=>
      el.style.getPropertyValue("display")),"none");
    assert.equal(await frame.locator(".service-event-triptych-image").count(),3);
    await p.getByRole("button",{name:"Save draft",exact:true}).click();
    await p.waitForFunction(async()=>{
      const db=await new Promise((resolve,reject)=>{
        const r=indexedDB.open("showset-studio2",1);
        r.onsuccess=()=>resolve(r.result);
        r.onerror=()=>reject(r.error);
      });
      try{return await new Promise(resolve=>{
        const req=db.transaction("documents").objectStore("documents").get("draft");
        req.onsuccess=()=>{
          const page=req.result?.pages?.["events-experiences"];
          resolve(page?.builder?.replacedNative?.includes("section-2") &&
            page.builder.roots.some(n=>n.name.startsWith("Rebuilt:")));
        };
      });}finally{db.close();}
    });
    await p.reload();
    await p.getByRole("button",{name:"Pages",exact:true}).first().click();
    await p.locator(".s2-page-list button")
      .filter({hasText:"/events-experiences/"}).click();
    await rebuilt.waitFor();
    await p.getByRole("button",{name:"Layers",exact:true}).first().click();
    await p.getByRole("button",{name:/Introduction section/}).first().click();
    await p.getByRole("button",{name:"Restore original section"}).click();
    await p.waitForFunction(()=>{
      const el=document.querySelector("iframe")?.contentDocument
        ?.querySelector(".service-intro");
      return !!el && el.style.getPropertyValue("display")!=="none";
    });
    assert.equal(await frame.locator(".s2-template-extensions > section").count(),0,
      "Restore original must hide the replacement chapter, not display both");
    assert.equal(await replacement.count(),0,
      "Restore must remove the native slot wrapper as well");
    // Undo/Redo are reversible and preserve original content.
    await p.getByRole("button",{name:"Undo",exact:true}).click();
    await p.waitForFunction(()=>{
      const el=document.querySelector("iframe")?.contentDocument
        ?.querySelector(".service-intro");
      return !!el && el.style.getPropertyValue("display")==="none";
    });
    await p.getByRole("button",{name:"Redo",exact:true}).click();
    await p.waitForFunction(()=>{
      const el=document.querySelector("iframe")?.contentDocument
        ?.querySelector(".service-intro");
      return !!el && el.style.getPropertyValue("display")!=="none";
    });
    assert.equal(await frame.locator(".s2-template-extensions > section").count(),0);
    await p.getByRole("button",{name:"Rebuild as editable section"}).click();
    await rebuilt.waitFor();
    assert.equal(await rebuilt.count(),1,
      "Rebuilding must recover the archived chapter without duplicates");
    assert.equal(await replacement.evaluate(el=>{
      const next=el.nextElementSibling;
      return next?.dataset.serviceSection==="section-2"||
        next?.dataset.section==="section-2";
    }),true,"Rebuilt section must return to exactly the same page position");
    assert.equal(await frame.locator(".service-intro").evaluate(el=>
      el.style.getPropertyValue("display")),"none");
    assert.deepEqual(errors,[]);
    await context.close();
    console.log("PASS in-place native editorial rebuilding, restore, undo/redo, stable placement and persisted source data.");
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
