// SHOWSET heading motion contract: static on editorial backgrounds; only photo
// scenes get the approved rectangular block swipe. No artificial delays.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const slugs=['','our-studio','our-work','events-experiences','creative-design','digital-marketing','content-production','contact','work/atmosphere-is-everything','work/made-to-be-remembered','work/behind-every-moment'];
const checks=[],errors=[];
const ck=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log(pass?'PASS':'FAIL',name,details??'')};
const sample=async(page,selector)=>page.locator(selector).evaluateAll(elements=>elements.map(el=>{
 const target=el.matches('.soft-rise')?el:(el.querySelector('.wipe-line>span')||el.querySelector('.case-heading-line>span'));
 if(!target)return {missing:true};
 const s=getComputedStyle(target);
 const bar=el.querySelector('.wipe-line')?getComputedStyle(el.querySelector('.wipe-line'),'::after'):null;
 return {text:el.textContent.trim().slice(0,70),opacity:s.opacity,transform:s.transform,clip:s.clipPath,animation:s.animationName,transition:s.transitionDuration,bar:bar?.display??null,barAnimation:bar?.animationName??null};
}));
const isStill=x=>!x.missing&&x.opacity==='1'&&x.transform==='none'&&x.clip==='none'&&x.animation==='none'&&(!x.bar||x.bar==='none');
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of[1440,390]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   for(const slug of slugs){
    const path='/'+(slug?slug+'/':'');
    await page.goto(base+path);
    await page.waitForSelector('[data-concept-ready="true"]');
    await page.evaluate(()=>document.fonts.ready);
    const scope='.view.is-current';
    const patterns=[
     '.soft-rise:is(h1,h2,h3,h4,h5,h6)',
     '.portfolio-heading .block-heading',
     '.contact-left .block-heading',
     '[data-service-reveal="editorial"]'
    ];
    for(const pattern of patterns){
     const selector=scope+' '+pattern;
     const count=await page.locator(selector).count();
     if(!count)continue;
     const before=await sample(page,selector);
     ck('Immediate editorial heading '+path+' '+width+' '+pattern,before.every(isStill),before);
     await page.locator(selector).first().evaluate(el=>scrollTo({top:scrollY+el.getBoundingClientRect().top-innerHeight/2,behavior:'instant'}));
     await page.waitForTimeout(150);
     const after=await sample(page,selector);
     ck('No heading intro after scrolling '+path+' '+width+' '+pattern,after.every(isStill),after);
    }
    if(slug.startsWith('work/')){
     const editorial=await sample(page,scope+' .case-editorial-heading');
     ck('Case editorial headings remain unmasked '+path+' '+width,editorial.length>0&&editorial.every(x=>!x.missing&&x.opacity==='1'&&x.clip==='none'&&x.animation==='none'),editorial.slice(0,3));
    }
    if(['events-experiences','creative-design','digital-marketing','content-production'].includes(slug)){
     const editorial=await sample(page,scope+' [data-service-reveal="editorial"]');
     ck('Service editorial headlines never mask '+path+' '+width,editorial.length>0&&editorial.every(isStill),editorial);
     if(['events-experiences','creative-design','content-production'].includes(slug)){
       const closing=await page.locator(scope+' .service-close--editorial h2').evaluate(el=>({
         first:getComputedStyle(el.querySelector('.plain-line:first-child')).color,
         second:getComputedStyle(el.querySelector('.plain-line:last-child')).color,
         period:getComputedStyle(el.querySelector('.service-period')).color
       }));
       ck('Compact editorial CTAs have no photographic swipe and retain the two-tone headline '+path+' '+width,
         await page.locator(scope+' .service-close--editorial .service-close-art').count()===0
         &&closing.second==='rgb(18, 186, 175)'&&closing.period==='rgb(250, 249, 253)',closing);
     }else{
       const photo=await page.locator(scope+' .service-close [data-service-reveal="photo"] .wipe-line').first().evaluate(el=>({
         overlay:getComputedStyle(el,'::after').display,mask:getComputedStyle(el.querySelector('span')).clipPath
       }));
       ck('Photographic closing CTA retains swipe '+path+' '+width,photo.overlay!=='none'&&photo.mask.startsWith('inset('),photo);
     }
     if(width===390){
       const track=await page.locator('[data-service-story-track]').getAttribute('data-service-pinned');
       if(track==='false'){
        const scenes=await sample(page,scope+' [data-service-reveal="scene"]');
        ck('Mobile non-overlaid story headings are static '+path,scenes.every(isStill),scenes);
       }
     }
    }
    ck('No viewport overflow '+path+' '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
   await context.close();
  }
  ck('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/non-photo-headlines.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
