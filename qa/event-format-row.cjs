// SHOWSET Events formats: one larger desktop row; silent, seamlessly looping
// mobile strip with manual/touch access, hidden scrollbars and reduced motion.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const expected=[
 'Corporate events & conferences','Brand activations','Product launches',
 'Festivals & public events','Gala dinners & celebrations','Immersive brand experiences'
];
const checks=[],errors=[];
function ck(name,pass,detail){
 checks.push({name,pass:!!pass,detail});
 console.log(pass?'PASS':'FAIL',name,detail??'');
}
const inventory=el=>{
 const items=[...el.querySelectorAll(':scope > li:not([data-event-format-clone])')];
 const clones=[...el.querySelectorAll(':scope > li[data-event-format-clone]')];
 const bounds=el.getBoundingClientRect();
 return {
  labels:items.map(x=>x.textContent.trim()),
  clones:clones.length,
  cloneHidden:clones.every(x=>x.getAttribute('aria-hidden')==='true'),
  top:items.map(x=>x.getBoundingClientRect().top),
  sizes:items.map(x=>parseFloat(getComputedStyle(x).fontSize)),
  whiteSpace:items.map(x=>getComputedStyle(x).whiteSpace),
  flexWrap:getComputedStyle(el).flexWrap,
  justification:getComputedStyle(el).justifyContent,
  scrollbar:getComputedStyle(el).scrollbarWidth,
  firstLeft:items[0]?.getBoundingClientRect().left,
  lastRight:items.at(-1)?.getBoundingClientRect().right,
  rowLeft:bounds.left,rowRight:bounds.right,
  scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,scrollLeft:el.scrollLeft,
  docWidth:document.documentElement.scrollWidth,
  viewportWidth:innerWidth
 };
};
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [320,390,600,768,1024,1366,1440,1550,1920]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/events-experiences/');
   await page.waitForSelector('[data-service-ready=true]');
   await page.evaluate(()=>document.fonts.ready);
   const strip=page.locator('.service-event-types');
   await strip.scrollIntoViewIfNeeded();
   const data=await strip.evaluate(inventory);
   ck('Events retains six original format labels @'+width,
     JSON.stringify(data.labels)===JSON.stringify(expected),data.labels);
   ck('Event formats remain one unbroken row @'+width,
     data.flexWrap==='nowrap'&&data.top.length===6&&
     Math.max(...data.top)-Math.min(...data.top)<2&&
     data.whiteSpace.every(x=>x==='nowrap'),data.top);
   ck('Enlarged editorial format typography @'+width,
     data.sizes.every(x=>x>=15.9&&x<=19.1),data.sizes);
   ck('Scrollbars are hidden @'+width,data.scrollbar==='none',data.scrollbar);
   ck('No horizontal page overflow @'+width,data.docWidth<=width+2,
     {document:data.docWidth,viewport:width});
   if(width>=1366){
    ck('Desktop row fully spans its container @'+width,
      data.scrollWidth<=data.clientWidth+2&&
      Math.abs(data.firstLeft-data.rowLeft)<2&&
      Math.abs(data.lastRight-data.rowRight)<2,
      {first:data.firstLeft,last:data.lastRight,edges:[data.rowLeft,data.rowRight],
       scroll:data.scrollWidth,client:data.clientWidth});
    ck('Desktop has no duplicated formats @'+width,data.clones===0,data.clones);
   }else if(width>600){
    ck('Tablet preserves manual horizontal scrolling @'+width,
      data.clones===0&&data.scrollWidth>data.clientWidth,
      {clones:data.clones,scroll:data.scrollWidth,client:data.clientWidth});
   }else{
    ck('Mobile has six accessibility-hidden loop items @'+width,
      data.clones===6&&data.cloneHidden,
      {clones:data.clones,hidden:data.cloneHidden});
    await page.waitForTimeout(120);
    const before=await strip.evaluate(el=>el.scrollLeft);
    await page.waitForTimeout(460);
    const after=await strip.evaluate(el=>el.scrollLeft);
    ck('Mobile automatically advances on screen @'+width,
      after>before+5,{before,after});
    await strip.focus();
    await page.waitForTimeout(80);
    const focused=await strip.evaluate(el=>el.scrollLeft);
    await page.waitForTimeout(250);
    const paused=await strip.evaluate(el=>el.scrollLeft);
    ck('Mobile marquee pauses for keyboard/manual interaction @'+width,
      Math.abs(paused-focused)<=1,{focused,paused});
   }
   if(width<=1024){
    const access=await strip.evaluate(el=>{
     const last=el.querySelector(':scope > li:not([data-event-format-clone]):nth-child(6)');
     el.scrollLeft+=last.getBoundingClientRect().right-el.getBoundingClientRect().right;
     return {right:last.getBoundingClientRect().right,frame:el.getBoundingClientRect().right};
    });
    ck('Last original label reachable by manual scrolling @'+width,
      access.right<=access.frame+2,access);
   }
   if([390,1440].includes(width)){
    fs.mkdirSync('qa-results/event-formats',{recursive:true});
    await page.locator('.service-intro').screenshot({
     path:'qa-results/event-formats/format-row-'+width+'.png',animations:'disabled'
    });
   }
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:900},reducedMotion:'reduce'});
  const page=await context.newPage();
  await page.goto(base+'/events-experiences/');
  await page.waitForSelector('[data-service-ready=true]');
  const strip=page.locator('.service-event-types');
  await strip.scrollIntoViewIfNeeded();
  const noMotion=await strip.evaluate(el=>({
   clones:el.querySelectorAll('[data-event-format-clone]').length,
   position:el.scrollLeft,scrollbar:getComputedStyle(el).scrollbarWidth
  }));
  await page.waitForTimeout(450);
  const after=await strip.evaluate(el=>el.scrollLeft);
  ck('Reduced motion disables autoscroll but keeps hidden manual scrollbar',
    noMotion.clones===0&&noMotion.scrollbar==='none'&&
    Math.abs(after-noMotion.position)<1,{noMotion,after});
  await context.close();
  ck('No JavaScript errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/event-format-row.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
