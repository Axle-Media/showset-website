// The two service headline phrases must each occupy exactly one line on
// desktop/tablet while mobile retains its approved centred fluid layout.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[];
function check(label,pass,detail){
 results.push({label,pass:!!pass,detail});
 console.log(pass?'PASS':'FAIL',label,pass?'':JSON.stringify(detail));
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,768,820,980,1100,1280,1440,1920]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   await page.goto(base+'/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   await page.evaluate(()=>document.fonts.ready);
   const result=await page.locator('.view.is-current .services-stage-intro').evaluate(section=>{
    const title=section.querySelector('h2.services-panel-heading');
    const spans=[...title.children];
    const available=section.getBoundingClientRect();
    const measure=span=>{
     const range=document.createRange();
     range.selectNodeContents(span);
     const rects=[...range.getClientRects()].filter(r=>r.width>0&&r.height>0);
     const lines=new Set(rects.map(r=>Math.round(r.top))).size;
     return {text:span.textContent.trim(),lines,top:span.getBoundingClientRect().top,
       right:Math.max(...rects.map(r=>r.right)),width:span.getBoundingClientRect().width};
    };
    return {font:getComputedStyle(title).fontSize,spans:spans.map(measure),
      availableRight:available.right,panelWidth:available.width,
      scrollWidth:document.documentElement.scrollWidth,
      viewport:innerWidth};
   });
   const [first,second]=result.spans;
   const tag=' @'+width+'px';
   check('Two approved sentences remain unchanged'+tag,
     first?.text==='Every discipline.'&&second?.text==='One creative partner.',result);
   if(width>=801){
    check('One line for each of the two sentences'+tag,
      first?.lines===1&&second?.lines===1&&second?.top>first?.top+1,result);
    check('Neither sentence extends outside the text column'+tag,
      first?.right<=result.availableRight+2&&second?.right<=result.availableRight+2,result);
   }
   check('No horizontal page overflow'+tag,result.scrollWidth<=width+2,result);
   await page.close();
  }
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/services-heading-two-lines.json',JSON.stringify(results,null,2));
  if(results.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
