// Keep the Digital & Marketing arrow/labels closer to the hero copy, without
// changing the mobile stacked composition or moving other service hero artwork.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[],errors=[];
function check(name,pass,detail){results.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [320,390,768,801,1024,1366,1440,1920]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/digital-marketing/');
   await page.waitForSelector('[data-service-ready=true]');
   await page.evaluate(()=>document.fonts.ready);
   const metrics=await page.locator('.service-hero--digital').evaluate(hero=>{
    const art=hero.querySelector('.service-digital-art');
    const a=art.getBoundingClientRect();
    const orbit=art.querySelector('.service-art-orbit').getBoundingClientRect();
    const arrow=art.querySelector('.service-art-arrow');
    const h=hero.getBoundingClientRect();
    const style=getComputedStyle(art);
    const labels=[...art.querySelectorAll('.service-art-label')];
    const content=hero.querySelector('.service-hero-content').getBoundingClientRect();
    return {position:style.position,right:style.right,artRight:h.right-a.right,
      artBottom:h.bottom-a.bottom,artWidth:a.width,heroWidth:h.width,
      orbitExtendsToBottom:orbit.bottom>=a.bottom-2,
      orbitExtendsToRight:orbit.right>=a.right-2,
      arrowSize:parseFloat(getComputedStyle(arrow).fontSize),
      labels:labels.map(x=>x.textContent.trim()),
      labelsWithinArt:labels.every(x=>{
        const r=x.getBoundingClientRect();
        return r.left>=a.left-2&&r.right<=a.right+2;
      }),copyLeft:content.left,documentWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth};
   });
   check('Four digital touchpoints retained '+width,
     JSON.stringify(metrics.labels)===JSON.stringify(['Websites','Campaigns','Social','Technology']),metrics.labels);
   if(width>800){
     check('Enlarged Digital illustration reaches section right and bottom edges '+width,
       metrics.position==='absolute' && Math.abs(metrics.artRight)<2 &&
       Math.abs(metrics.artBottom)<2 &&
       Math.abs(metrics.artWidth/metrics.heroWidth-.52)<.012,
       {right:metrics.artRight,bottom:metrics.artBottom,ratio:metrics.artWidth/metrics.heroWidth});
     check('Larger orbit visually crosses section right and bottom '+width,
       metrics.orbitExtendsToBottom && metrics.orbitExtendsToRight &&
       metrics.arrowSize>=Math.min(610,Math.max(250,width*.38))-2,metrics);
     check('Labels remain inside their artwork frame '+width,metrics.labelsWithinArt,metrics);
   }else{
     check('Mobile Digital illustration stays in stacked layout '+width,
       metrics.position==='relative'&&Math.abs(metrics.artRight-metrics.copyLeft)<2,metrics);
   }
   check('No document-wide horizontal overflow '+width,
     metrics.documentWidth<=width+2,metrics.documentWidth);
   if([390,1440].includes(width)){
     fs.mkdirSync('qa-results/digital-hero-position',{recursive:true});
     await page.locator('.service-hero--digital').screenshot({
       path:'qa-results/digital-hero-position/digital-'+width+'.png',
       animations:'disabled'});
   }
   await ctx.close();
  }
  check('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/digital-hero-position.json',JSON.stringify({results,errors},null,2));
  if(results.some(r=>!r.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
