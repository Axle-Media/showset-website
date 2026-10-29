// SHOWSET Events & Experiences: the six format labels form one continuous row.
// Small viewports scroll within the row; they never wrap or overflow the page.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
function ck(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try {
  for(const width of [320,390,768,1024,1366,1440,1550,1920]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage();
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(base+'/events-experiences/');
   await page.waitForSelector('[data-service-ready=true]');
   await page.evaluate(()=>document.fonts.ready);
   const data=await page.locator('.service-event-types').evaluate(el=>{
    const items=[...el.querySelectorAll('li')];
    return {
      labels:items.map(x=>x.textContent.trim()),
      top:items.map(x=>x.getBoundingClientRect().top),
      sizes:items.map(x=>parseFloat(getComputedStyle(x).fontSize)),
      whiteSpace:items.map(x=>getComputedStyle(x).whiteSpace),
      flexWrap:getComputedStyle(el).flexWrap,
      scrollWidth:el.scrollWidth,
      clientWidth:el.clientWidth,
      documentWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth
    };
   });
   const expected=['Corporate events & conferences','Brand activations','Product launches','Festivals & public events','Gala dinners & celebrations','Immersive brand experiences'];
   ck('Events formats retain all six labels '+width,JSON.stringify(data.labels)===JSON.stringify(expected),data.labels);
   ck('All six formats are on exactly one row '+width,
      data.flexWrap==='nowrap' && data.top.length===6 &&
      Math.max(...data.top)-Math.min(...data.top)<2 &&
      data.whiteSpace.every(x=>x==='nowrap'),{top:data.top,wrap:data.flexWrap});
   ck('Compact event-format typography '+width,
      data.sizes.every(x=>x>=11.9 && x<=14.1),data.sizes);
   ck('Format row fits desktop, scrolls internally on small screens '+width,
      width<1366 || data.scrollWidth<=data.clientWidth+2,
      {scroll:data.scrollWidth,client:data.clientWidth});
   ck('No horizontal page overflow '+width,data.documentWidth<=width+2,
      {document:data.documentWidth,viewport:width});
   if(width<=1024){
    const access=await page.locator('.service-event-types').evaluate(el=>{
      el.scrollLeft=el.scrollWidth;
      const last=el.querySelector('li:last-child').getBoundingClientRect();
      const frame=el.getBoundingClientRect();
      return {lastRight:last.right,frameRight:frame.right,scrollLeft:el.scrollLeft};
    });
    ck('Last label reachable by horizontal scroll '+width,
      access.lastRight<=access.frameRight+2,access);
   }
   if([390,1440].includes(width)){
    fs.mkdirSync('qa-results/event-formats',{recursive:true});
    await page.locator('.service-intro').screenshot({path:'qa-results/event-formats/format-row-'+width+'.png',animations:'disabled'});
   }
   await context.close();
  }
  ck('No JavaScript errors',errors.length===0,errors);
 } finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/event-format-row.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
