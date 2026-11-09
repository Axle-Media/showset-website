// Confirm the title and button are vertically balanced in the shortened
// closing CTA on Home and individual case-study pages at common viewports.
const { chromium }=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[];
const check=(label,ok,data)=>{
  results.push({label,pass:!!ok,data});
  console.log(ok?'PASS':'FAIL',label,ok?'':JSON.stringify(data));
};
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,768,1440,1802]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   for(const [route,sectionSelector] of [['/','#ending'],['/work/the-amaze-ball/','#case-ending']]){
    await page.goto(base+route);
    await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    const geometry=await page.locator('.view.is-current '+sectionSelector).evaluate(section=>{
      const rect=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height};};
      const title=section.querySelector('h2');
      const button=section.querySelector('.end-bottom .end-link');
      const paragraph=section.querySelector('.end-bottom > p');
      const a=rect(section),h=rect(title),b=rect(button);
      const before=h.top-a.top,after=a.bottom-b.bottom;
      return {before,after,imbalance:Math.abs(before-after),
        height:a.height,heading:h.height,button:b.height,
        paragraphVisible:!!paragraph && !paragraph.hidden && paragraph.getBoundingClientRect().height>0,
        xCenter:Math.abs((h.left+h.right)/2-(a.left+a.right)/2),
        align:getComputedStyle(section).justifyContent,
        display:getComputedStyle(section).display,
        buttonLabel:button.textContent.trim(),
        href:button.getAttribute('href')};
    });
    const label=route+' @'+width+'px';
    check('CTA heading and button have balanced top/bottom spacing '+label,
      geometry.imbalance<=18,geometry);
    if(width>600){
      check('Tablet and desktop CTA centred as a group '+label,
        geometry.display==='flex'&&geometry.align==='center'&&
        geometry.height<=525,geometry);
    }
    check('CTA supporting paragraph visible '+label,geometry.paragraphVisible,geometry);
    check('CTA wording and destination preserved '+label,
      geometry.buttonLabel.startsWith('Start a conversation')&&
      geometry.href==='/contact/#contact-form');
    check('No horizontal overflow '+label,
      await page.evaluate(w=>document.documentElement.scrollWidth<=w+2,width));
   }
   await page.close();
  }
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/closing-cta-vertical-centre.json',JSON.stringify(results,null,2));
  if(results.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
