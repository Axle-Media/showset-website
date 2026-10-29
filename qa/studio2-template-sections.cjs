const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||"playwright");
const assert=require("node:assert/strict");
const base=process.env.SHOWSET_BASE_URL||"http://localhost:3001";
(async()=>{
  const browser=await chromium.launch({
    channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||"chrome",headless:true
  });
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000},
      acceptDownloads:true});
    const p=await context.newPage();
    const errors=[];p.on("pageerror",e=>errors.push(e.message));
    await p.goto(base+"/studio/next/");
    const d=p.waitForEvent("download");
    await p.getByRole("button",{name:"Back up and start editing"}).click();
    await d;
    await p.getByRole("button",{name:"Pages",exact:true}).first().click();
    await p.locator(".s2-page-list button").filter({hasText:"/events-experiences/"}).click();
    const frame=p.frameLocator("iframe");
    const scene=frame.locator(".service-event-triptych-image");
    await scene.first().waitFor();
    assert.equal(await scene.count(),3,"original cinematic scenes preserved");
    const sections=frame.locator("[data-studio2-template-sections] > section.s2-node-section");
    assert.equal(await sections.count(),0,"seed native page has no owner sections");
    await p.getByRole("button",{name:"Add",exact:true}).first().click();
    await p.locator(".s2-library button").first().click();
    await sections.first().waitFor();
    assert.equal(await sections.count(),1,"new native-page section is visible");
    const positioned=await frame.locator(".service-experience").evaluate(root=>{
      const extra=root.querySelector("[data-studio2-template-sections]");
      const close=root.querySelector(".service-close");
      return !!extra&&!!close&&extra.nextElementSibling===close;
    });
    assert.equal(positioned,true,"owner section is before native closing CTA");
    await p.getByRole("button",{name:"Layers",exact:true}).first().click();
    assert.equal(await p.getByRole("button",{name:"Select New editorial section"}).count(),1);
    await p.getByRole("button",{name:"Select Heading"}).click();
    const input=p.getByLabel("Headline",{exact:true}).first();
    await input.fill("An entirely new chapter.");
    await input.blur();
    await frame.locator("[data-studio2-template-sections] h2").filter({
      hasText:"An entirely new chapter."
    }).waitFor();
    await p.getByRole("button",{name:"Select New editorial section"}).click();
    await p.getByRole("button",{name:"Add",exact:true}).first().click();
    await p.locator(".s2-library button").filter({
      hasText:"Image"
    }).first().click();
    await frame.locator("[data-studio2-template-sections] .s2-node-image img").waitFor();
    await p.getByRole("button",{name:"Layers",exact:true}).first().click();
    await p.getByRole("button",{name:"Select New editorial section"}).click();
    await p.getByRole("button",{name:"Duplicate",exact:true}).click();
    await p.waitForFunction(()=>{
      const doc=document.querySelector("iframe")?.contentDocument;
      return doc?.querySelectorAll("[data-studio2-template-sections] > section.s2-node-section").length===2;
    });
    const before=await sections.evaluateAll(nodes=>nodes.map(n=>n.dataset.builderNode));
    await p.getByRole("button",{name:"Move up",exact:true}).click();
    const after=await sections.evaluateAll(nodes=>nodes.map(n=>n.dataset.builderNode));
    assert.equal(before.length,2);
    assert.deepEqual(after,[before[1],before[0]],"owner sections reorder safely");
    await p.getByRole("button",{name:"Delete",exact:true}).click();
    assert.equal(await sections.count(),1);
    await p.getByRole("button",{name:"Undo",exact:true}).click();
    await p.waitForFunction(()=>{
      const doc=document.querySelector("iframe")?.contentDocument;
      return doc?.querySelectorAll("[data-studio2-template-sections]>section").length===2;
    });
    await p.getByRole("button",{name:"Redo",exact:true}).click();
    await p.waitForFunction(()=>{
      const doc=document.querySelector("iframe")?.contentDocument;
      return doc?.querySelectorAll("[data-studio2-template-sections]>section").length===1;
    });
    await p.getByRole("button",{name:"Save draft",exact:true}).click();
    await p.waitForFunction(async()=>{
      const db=await new Promise((resolve,reject)=>{
        const r=indexedDB.open("showset-studio2",1);
        r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
      });
      try{
        return await new Promise(resolve=>{
          const r=db.transaction("documents").objectStore("documents").get("draft");
          r.onsuccess=()=>{
            const roots=r.result?.pages?.["events-experiences"]?.builder?.roots;
            resolve(roots?.length===1&&roots[0]?.kind==="section"&&
              roots[0]?.children.some(n=>n.props?.text==="An entirely new chapter.")&&
              roots[0]?.children.some(n=>n.kind==="image"));
          };
        });
      }finally{db.close();}
    });
    await p.reload();
    await p.getByRole("button",{name:"Pages",exact:true}).first().click();
    await p.locator(".s2-page-list button").filter({hasText:"/events-experiences/"}).click();
    await frame.locator("[data-studio2-template-sections] h2").filter({
      hasText:"An entirely new chapter."
    }).waitFor();
    assert.equal(await frame.locator(".service-event-triptych-image").count(),3);
    await p.getByRole("button",{name:"Mobile",exact:true}).click();
    assert.equal(await frame.locator("[data-studio2-template-sections] h2").first()
      .evaluate(el=>getComputedStyle(el).textAlign),"center");
    assert.deepEqual(errors,[],"no browser exceptions");
    await context.close();
    console.log("PASS approved page retains native scenes; add/nest/edit/duplicate/reorder/delete/undo/redo/save/reload mobile owner sections.");
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
