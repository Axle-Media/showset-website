// Footer line-wrap and capability-hover regression for the shared SHOWSET site.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const slugs=['events-experiences','creative-design','digital-marketing','content-production'];
const checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')};
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of[1440,768,390,320]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   for(const slug of['',...slugs]){
    const route='/'+(slug?slug+'/':'');
    await page.goto(base+route);await page.waitForSelector('[data-concept-ready=true]');
    await page.evaluate(()=>document.fonts.ready);
    const footer=await page.locator('.footer-identity > p').evaluate(p=>{
      const first=p.childNodes[0],second=p.childNodes[p.childNodes.length-1];
      const lines=node=>{const r=document.createRange();r.selectNodeContents(node);return [...r.getClientRects()].filter(x=>x.width>0.5).map(x=>({top:x.top,right:x.right,left:x.left}));};
      const a=lines(first),b=lines(second),css=getComputedStyle(p);
      return {text:p.textContent,hardBreaks:p.querySelectorAll('br').length,first:a,second:b,
       size:parseFloat(css.fontSize),whiteSpace:css.whiteSpace,container:p.parentElement.getBoundingClientRect().width};
    });
    ck('Footer statement stays exactly two lines on '+route+' at '+width,
      footer.hardBreaks===1&&footer.first.length===1&&footer.second.length===1
      &&footer.first[0].top<footer.second[0].top
      &&footer.size<=11&&footer.whiteSpace==='nowrap',footer);
    ck('Footer fits viewport on '+route+' at '+width,
      await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(width===1440&&slug){
      const card=page.locator('.service-expertise-grid > .service-capability-group').first();
      await card.scrollIntoViewIfNeeded();await page.waitForTimeout(1250);
      const normal=await card.evaluate(el=>getComputedStyle(el).scale);
      await card.hover();await page.waitForTimeout(420);
      const raised=await card.evaluate(el=>({scale:getComputedStyle(el).scale,shadow:getComputedStyle(el).boxShadow}));
      await page.mouse.move(0,0);await page.waitForTimeout(420);
      const reset=await card.evaluate(el=>getComputedStyle(el).scale);
      ck('Capability card gently grows on hover then returns '+slug,
        normal==='1'&&Math.abs(parseFloat(raised.scale)-1.025)<.002
        &&raised.shadow!=='none'&&reset==='1',{normal,raised,reset});
    }
   }
   await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  await page.goto(base+'/events-experiences/');await page.waitForSelector('[data-service-ready=true]');
  const card=page.locator('.service-expertise-grid > .service-capability-group').first();
  await card.scrollIntoViewIfNeeded();await card.hover();await page.waitForTimeout(100);
  ck('Reduced motion disables capability card hover scaling',
    await card.evaluate(el=>getComputedStyle(el).scale==='1'));
  await ctx.close();
  ck('No browser exceptions',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/footer-capability-hover.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});