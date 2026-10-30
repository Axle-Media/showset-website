// Production browser acceptance: every public, continuously scrolling
// carousel must be control-free and obey hover -> pause -> immediate resume.
// Reduced-motion and touch accessibility remain intentionally supported.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[];
const ck=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log(pass?'PASS':'FAIL',name,details||'')};
const cases=['atmosphere-is-everything','made-to-be-remembered','provault'];
const entries=[
 {route:'/',selector:'#case-rail',label:'Homepage'},
 ...cases.map(slug=>({route:'/work/'+slug+'/',selector:'[data-case-gallery]',label:slug}))
];
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  for(const {route,selector,label} of entries){
   await page.goto(base+route);
   await page.waitForSelector('[data-concept-ready="true"]');
   const gallery=page.locator(selector);
   await gallery.scrollIntoViewIfNeeded();
   await page.waitForFunction(selector=>document.querySelector(selector)?.dataset.caseLoop==='true',selector,{timeout:12000});
   ck(label+' has no play/pause buttons',await page.locator(
     '[data-case-gallery-motion-toggle],.case-home-motion-toggle,.case-gallery-motion-toggle,button[aria-label*="automatic carousel movement"]'
   ).count()===0);
   ck(label+' has an infinite looping track',await gallery.getAttribute('data-case-loop')==='true');
   await page.mouse.move(0,0);
   await page.waitForTimeout(250);
   const start=await gallery.evaluate(el=>el.scrollLeft);
   await page.waitForTimeout(1050);
   const after=await gallery.evaluate(el=>el.scrollLeft);
   ck(label+' automatically scrolls without interaction',after-start>14,{start,after});
   const box=await gallery.boundingBox();
   ck(label+' track is measurable',!!box,{box});
   if(!box)continue;
   await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
   await page.waitForTimeout(90);
   const hovering=await gallery.evaluate(el=>el.scrollLeft);
   await page.waitForTimeout(700);
   const hovered=await gallery.evaluate(el=>el.scrollLeft);
   ck(label+' freezes during mouse hover',Math.abs(hovered-hovering)<3,{hovering,hovered});
   await page.mouse.move(0,0);
   await page.waitForTimeout(110);
   const left=await gallery.evaluate(el=>el.scrollLeft);
   await page.waitForTimeout(950);
   const resumed=await gallery.evaluate(el=>el.scrollLeft);
   ck(label+' resumes after the mouse leaves',resumed-left>12,{left,resumed});
  }

  // After dragging, a mouse-induced focused card must not stall playback.
  await page.goto(base+'/');
  await page.waitForSelector('[data-concept-ready="true"]');
  const rail=page.locator('#case-rail');
  await rail.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#case-rail')?.dataset.caseLoop==='true');
  const r=await rail.boundingBox();
  await page.mouse.move(r.x+r.width*.52,r.y+r.height*.5);
  await page.mouse.down();
  await page.mouse.move(r.x+r.width*.72,r.y+r.height*.5,{steps:12});
  await page.mouse.up();
  await page.mouse.move(0,0);
  await page.waitForTimeout(120);
  const dragStart=await rail.evaluate(el=>el.scrollLeft);
  await page.waitForTimeout(950);
  const dragEnd=await rail.evaluate(el=>el.scrollLeft);
  ck('Mouse drag does not permanently pause homepage autoplay',dragEnd-dragStart>12,{dragStart,dragEnd});

  // Reduced-motion visitors retain a navigable gallery without forced travel.
  const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const rp=await reduced.newPage();
  for(const {route,selector,label} of [entries[0],entries[1]]){
   await rp.goto(base+route);
   await rp.waitForSelector('[data-concept-ready="true"]');
   const gallery=rp.locator(selector);
   await gallery.scrollIntoViewIfNeeded();
   await rp.waitForTimeout(230);
   const before=await gallery.evaluate(el=>el.scrollLeft);
   await rp.waitForTimeout(1000);
   const after=await gallery.evaluate(el=>el.scrollLeft);
   ck(label+' respects reduced motion',Math.abs(after-before)<3,{before,after});
   ck(label+' hides no essential controls on reduced motion',
     await rp.locator('[data-case-gallery-motion-toggle]').count()===0);
  }
  await reduced.close();

  // Touch interaction may pause briefly to prevent fighting a swipe, but
  // automatic scrolling must resume without a lingering emulated hover.
  const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const tp=await touch.newPage();
  await tp.goto(base+'/work/atmosphere-is-everything/');
  await tp.waitForSelector('[data-concept-ready="true"]');
  const t=tp.locator('[data-case-gallery]');
  await t.scrollIntoViewIfNeeded();
  await tp.waitForFunction(()=>document.querySelector('[data-case-gallery]')?.dataset.caseLoop==='true');
  await tp.waitForTimeout(150);
  const touchBefore=await t.evaluate(el=>el.scrollLeft);
  await tp.waitForTimeout(1050);
  const touchAfter=await t.evaluate(el=>el.scrollLeft);
  ck('Mobile case-study gallery autoscrolls',touchAfter-touchBefore>12,{touchBefore,touchAfter});
  const tb=await t.boundingBox();
  await tp.touchscreen.tap(tb.x+tb.width*.5,tb.y+tb.height*.5);
  // A tap opens the lightbox; close with its dedicated close action, then
  // ensure the touch pointer did not leave the carousel in hover-pause state.
  if(await tp.locator('[data-case-lightbox]').isVisible()){
   await tp.locator('[data-case-close]').click();
  }
  await tp.waitForTimeout(2800);
  const touchResumeStart=await t.evaluate(el=>el.scrollLeft);
  await tp.waitForTimeout(1050);
  const touchResumeEnd=await t.evaluate(el=>el.scrollLeft);
  ck('Mobile gallery resumes after touch and lightbox close',
    touchResumeEnd-touchResumeStart>12,{touchResumeStart,touchResumeEnd});
  await touch.close();

  ck('No uncaught browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/carousel-playback.json',JSON.stringify(checks,null,2));
  if(checks.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
