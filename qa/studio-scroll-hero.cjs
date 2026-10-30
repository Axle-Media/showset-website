// Studio hero contract: the approved homepage-style camera opens up as
// the first two-line headline lifts and the next follows on scroll.
const fs=require('node:fs');
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
const assert=(name,pass,info)=>{checks.push({name,pass:!!pass,info});console.log(pass?'PASS':'FAIL',name,info??'')};
(async()=>{
 fs.mkdirSync('qa-results/editorial',{recursive:true});
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
 for(const width of [1440,800,390,320]){
  const c=await browser.newContext({viewport:{width,height:900}});
  const page=await c.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/our-studio/');
  await page.waitForSelector('.view.is-current .studio-hero-track[data-studio-motion="on"]');
  const snapshot=()=>page.locator('.studio-hero-track').evaluate(track=>{
   const photo=track.querySelector('[data-studio-hero-photo]');
   const first=track.querySelector('[data-studio-hero-first]');
   const follow=track.querySelector('[data-studio-hero-follow]');
   const photoRect=photo.getBoundingClientRect();
   return {p:Number(track.dataset.studioProgress||0),photoWidth:photoRect.width,
    firstOpacity:Number(getComputedStyle(first).opacity),
    secondOpacity:Number(getComputedStyle(follow).opacity),
    secondTop:follow.getBoundingClientRect().top,
    firstHidden:first.getAttribute('aria-hidden'),
    secondHidden:follow.getAttribute('aria-hidden'),
    position:getComputedStyle(track.querySelector('.studio-hero-stage')).position,
    firstHeadline:first.querySelector('h1')?.innerText,
    secondHeadline:follow.querySelector('h2')?.innerText,
    color:getComputedStyle(follow.querySelector('.accent-line>span')).color,
    punctuation:getComputedStyle(follow.querySelector('.hero-period')).color,
    image:photo.querySelector('img')?.getAttribute('src'),
    imgLoaded:photo.querySelector('img')?.complete&&photo.querySelector('img')?.naturalWidth>0,
    firstClip:getComputedStyle(first.querySelector('.accent-line>span')).clipPath,
    secondClip:getComputedStyle(follow.querySelector('.accent-line>span')).clipPath
   };
  });
  await page.waitForTimeout(1200);
  const a=await snapshot();
  assert('Studio inset opening photo '+width,a.photoWidth<width*.94&&a.photoWidth>width*.7&&a.position==='sticky',a);
  assert('Studio first scene visible '+width,a.firstOpacity>=.99&&a.secondOpacity<=.01&&a.firstHidden==='false'&&a.secondHidden==='true',a);
  assert('Studio original first heading '+width,a.firstHeadline?.replace(/\s+/g,' ').includes('Curious minds.')&&a.firstHeadline.includes('Capable hands.'),a.firstHeadline);
  assert('Studio headline text is unmasked, not merely in the DOM '+width,!a.firstClip.includes('100%'),a.firstClip);
  assert('Studio photo is ready '+width,a.imgLoaded&&a.image===require('../content/pages.json')['our-studio'].sections[0].image,a.image);
  const at=async fraction=>{
   await page.locator('.studio-hero-track').evaluate((track,fraction)=>{
    window.scrollTo({top:window.scrollY+track.getBoundingClientRect().top+
     Math.max(1,track.offsetHeight-window.innerHeight)*fraction,behavior:'instant'});
   },fraction);
   await page.waitForTimeout(1100);
   return snapshot();
  };
  const mid=await at(.47);
  const b=await at(.88);
  assert('Studio image expands full-bleed '+width,b.photoWidth>=width-3&&b.photoWidth>mid.photoWidth&&b.photoWidth>a.photoWidth,b);
  assert('Studio second line follows first upwards '+width,b.secondOpacity>.98&&b.firstOpacity<.05&&b.firstHidden==='true'&&b.secondHidden==='false',b);
  assert('Follow-up heading has correct brand colours '+width,b.color==='rgb(18, 186, 175)'&&b.punctuation==='rgb(250, 249, 253)',b);
  assert('Follow-up text is not a duplicate '+width,b.secondHeadline?.includes('We make it happen.'),b.secondHeadline);
  assert('Second headline is fully revealed after the wipe '+width,!b.secondClip.includes('100%'),b.secondClip);
  const back=await at(.02);
  assert('Hero reverses when scrolling back '+width,back.firstOpacity>.95&&back.secondOpacity<.05&&back.photoWidth<b.photoWidth,back);
  assert('Studio no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(width===1440||width===390){
   await at(0);
   await page.screenshot({path:'qa-results/editorial/studio-hero-first-'+width+'.png'});
   await at(.88);
   await page.screenshot({path:'qa-results/editorial/studio-hero-second-'+width+'.png'});
  }
  await c.close();
 }
 const c=await browser.newContext({viewport:{width:390,height:850},reducedMotion:'reduce'});
 const page=await c.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/our-studio/');
 await page.waitForSelector('[data-concept-ready="true"]');
 const reduced=await page.locator('.studio-hero-track').evaluate(track=>{
   const scenes=[...track.querySelectorAll('.studio-hero-scene')];
   return {motion:track.dataset.studioMotion,position:getComputedStyle(track.querySelector('.studio-hero-stage')).position,
    height:track.getBoundingClientRect().height,visible:scenes.map(el=>getComputedStyle(el).opacity),
    inaccessible:scenes.map(el=>el.hasAttribute('inert'))};
 });
 assert('Reduced motion uses normal flow and readable headings',reduced.motion!=='on'&&reduced.position==='relative'&&reduced.inaccessible.every(v=>!v),reduced);
 await c.close();
 const nojs=await browser.newContext({viewport:{width:390,height:850},javaScriptEnabled:false});
 const fallback=await nojs.newPage();
 await fallback.goto(base+'/our-studio/');
 const passive=await fallback.locator('.studio-hero-track').evaluate(el=>({
  hasFirst:!!el.querySelector('h1'),hasSecond:!!el.querySelector('h2'),
  secondVisibility:getComputedStyle(el.querySelector('[data-studio-hero-follow]')).opacity
 }));
 assert('No-JS shows both Studio hero statements',passive.hasFirst&&passive.hasSecond&&passive.secondVisibility==='1',passive);
 await nojs.close();
 assert('No browser exceptions',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.writeFileSync('qa-results/studio-scroll-hero.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
