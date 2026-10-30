const assert=require("node:assert/strict");
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||"playwright");
const base=process.env.SHOWSET_BASE_URL||"http://127.0.0.1:3002";
(async()=>{
 const browser=await chromium.launch({
  channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||"chrome",headless:true
 });
 try{
  const ctx=await browser.newContext({viewport:{width:1440,height:900},
   acceptDownloads:true,reducedMotion:"no-preference"});
  const p=await ctx.newPage(),errors=[];
  p.on("pageerror",e=>errors.push(e.message));
  await p.goto(base+"/studio/next/");
  const backup=p.waitForEvent("download");
  await p.getByRole("button",{name:"Back up and start editing"}).click();
  await backup;
  const frame=p.frameLocator("iframe");
  const choose=async name=>{
    await p.getByRole("button",{name:"Layers",exact:true}).first().click();
    await p.locator(".s2-navigator .s2-page-list button")
      .filter({hasText:name}).first().click();
  };
  await choose("Manifesto section");
  await p.getByRole("button",{name:"Background",exact:true}).click();
  await p.getByLabel("Approved S + dot pattern").check();
  await frame.locator('#discover > [data-studio2-native-pattern="home-section-section-2"]').waitFor();
  assert.equal(await frame.locator("#discover").count(),1);
  await p.getByLabel("Pattern X (%)").fill("140");
  await p.getByLabel("Pattern X (%)").blur();
  await p.waitForFunction(()=>{
    const f=document.querySelector("iframe"),doc=f?.contentDocument,
      el=doc?.querySelector('#discover > [data-studio2-native-pattern]');
    return !!el && f.contentWindow.getComputedStyle(el).backgroundPosition==="140% 50%";
  });
  await p.getByRole("button",{name:"Motion",exact:true}).click();
  await p.getByLabel("Editorial entrance").selectOption("fade");
  await p.waitForFunction(()=>{
    const f=document.querySelector("iframe"),doc=f?.contentDocument,
      el=doc?.querySelector("#discover > :not([data-studio2-native-pattern])");
    return !!el && f.contentWindow.getComputedStyle(el).animationName
      .includes("s2-native-home-section-section-2");
  });
  await choose("Film section");
  await p.getByRole("button",{name:"Background",exact:true}).click();
  assert.equal(await p.getByLabel("Approved S + dot pattern").count(),0);
  await p.getByRole("button",{name:"Motion",exact:true}).click();
  await p.getByText(/retains its approved cinematic animation engine/).waitFor();
  assert.equal(await p.getByLabel("Editorial entrance").count(),0);
  await choose("Manifesto section");
  await p.getByRole("button",{name:"Mobile",exact:true}).click();
  await p.getByRole("button",{name:"Background",exact:true}).click();
  await p.getByLabel("Pattern X (%)").fill("70");
  await p.getByLabel("Pattern X (%)").blur();
  await p.waitForFunction(()=>{
    const f=document.querySelector("iframe"),doc=f?.contentDocument,
      el=doc?.querySelector('#discover > [data-studio2-native-pattern]');
    return !!el && f.contentWindow.innerWidth<=600 &&
      f.contentWindow.getComputedStyle(el).backgroundPosition==="70% 50%";
  });
  await p.getByRole("button",{name:"Save draft",exact:true}).click();
  await p.waitForTimeout(900);
  await p.reload();
  await frame.locator('#discover > [data-studio2-native-pattern="home-section-section-2"]').waitFor();
  // A reloaded Studio opens at desktop; the original desktop focus must be
  // visible again before switching to the saved mobile override.
  await p.waitForFunction(()=>{
    const f=document.querySelector("iframe"),doc=f?.contentDocument,
      el=doc?.querySelector("#discover > [data-studio2-native-pattern]");
    return !!el && f.contentWindow.getComputedStyle(el).backgroundPosition==="140% 50%";
  });
  await p.getByRole("button",{name:"Mobile",exact:true}).click();
  await p.waitForFunction(()=>{
    const f=document.querySelector("iframe"),doc=f?.contentDocument,
      el=doc?.querySelector("#discover > [data-studio2-native-pattern]");
    return !!el && f.contentWindow.innerWidth<=600 &&
      f.contentWindow.getComputedStyle(el).backgroundPosition==="70% 50%";
  });
  // A saved preview consumes the exact same canonical native overrides.
  await p.getByRole("button",{name:"Save local preview",exact:false}).click();
  const preview=await ctx.newPage();
  await preview.goto(base+"/studio/next/preview/?page=home");
  await preview.locator('#discover > [data-studio2-native-pattern="home-section-section-2"]').waitFor();
  assert.equal(await preview.locator("#film-track").count(),1,
    "Original pinned film track is preserved in the saved preview");
  await preview.close();
  assert.deepEqual(errors,[]);
  await ctx.close();
  console.log("PASS native Home editorial pattern, positioning, motion, pinned protection, breakpoint persistence and saved preview.");
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
