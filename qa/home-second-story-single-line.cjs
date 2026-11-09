// Keep only the second Home story caption to one line on wide screens.
// Smaller viewports must still wrap naturally without horizontal overflow.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[];
const expected='Ideas become identities, environments and experiences, refined to the last detail.';
function ck(label,ok,detail){
 results.push({label,pass:!!ok,detail});
 console.log(ok?'PASS':'FAIL',label,ok?'':JSON.stringify(detail));
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,768,1024,1100,1440,1802]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   await page.goto(base+'/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.locator('.view.is-current .film-step[data-film-step="1"] > p').evaluate(p=>{
    const range=document.createRange();
    range.selectNodeContents(p);
    const rects=[...range.getClientRects()];
    const r=p.getBoundingClientRect(),root=document.querySelector('.view.is-current .film-steps').getBoundingClientRect();
    return {
      lines:rects.filter(r=>r.width>0).length,
      text:p.textContent.trim(),
      whitespace:getComputedStyle(p).whiteSpace,
      boxRight:r.right,
      textRight:Math.max(...rects.map(x=>x.right)),
      availableRight:root.right,
      scrollWidth:document.documentElement.scrollWidth
    };
   });
   const tag=' @'+width+'px';
   ck('Approved wording preserved'+tag,metrics.text===expected,metrics);
   if(width>=1100){
    ck('Single line on desktop'+tag,metrics.lines===1&&metrics.whitespace==='nowrap',metrics);
    ck('Desktop caption remains inside its column'+tag,metrics.textRight<=metrics.availableRight+2,metrics);
   } else {
    ck('Narrow layouts may wrap naturally'+tag,metrics.whitespace!=='nowrap',metrics);
   }
   ck('No horizontal page overflow'+tag,metrics.scrollWidth<=width+2,metrics);
   await page.close();
  }
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/home-second-story-single-line.json',JSON.stringify(results,null,2));
  if(results.some(r=>!r.pass))process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
