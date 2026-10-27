// Browser acceptance: the homepage and Our Work always reflect each case study's hero.
const { chromium }=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://localhost:3001';
const checks=[];
const ck=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log(pass?'PASS':'FAIL',name,details||'')};
const routes=['atmosphere-is-everything','made-to-be-remembered','behind-every-moment'];
const pageUrl=id=>'/work/'+id+'/';
const width=1440;
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try {
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const expected={};
  for(const id of routes){
   await page.goto(base+pageUrl(id));
   await page.waitForSelector('[data-case-experience]');
   expected[id]=await page.locator('.case-opening-first > img').getAttribute('src');
   ck(id+' opening photo loaded',await page.locator('.case-opening-first > img').evaluate(i=>i.complete&&i.naturalWidth>0),expected[id]);
  }
  await page.goto(base+'/');
  await page.waitForSelector('[data-concept-ready="true"]');
  const cards=page.locator('#case-rail > [data-case-slide]');
  ck('Home has all 3 unique original cards',await cards.count()===3);
  // These images are intentionally lazy-loaded; scroll to the rail before
  // checking the decoded asset instead of racing the browser's loader.
  await page.locator('#case-rail').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>[...document.querySelectorAll('#case-rail > [data-case-slide] img')].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:10000});
  for(let i=0;i<routes.length;i++){
   const src=await cards.nth(i).locator('img').getAttribute('src');
   ck('Home featured photo matches '+routes[i],src===expected[routes[i]],src);
   ck('Home image loads '+routes[i],await cards.nth(i).locator('img').evaluate(i=>i.complete&&i.naturalWidth>0));
   ck('Home card links to '+routes[i],(await cards.nth(i).getAttribute('href'))===pageUrl(routes[i]));
  }
  const gallery=page.locator('#case-rail');
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  ck('Home creates accessible circular gallery',await gallery.getAttribute('data-case-loop')==='true');
  // Ensure that scrolling the rail into view did not leave the browser's
  // pointer hovering over it. Hover intentionally suspends autoplay.
  await page.mouse.move(0,0);
  await page.waitForTimeout(1700);
  const start=await gallery.evaluate(el=>el.scrollLeft);
  await page.waitForTimeout(1800);
  const end=await gallery.evaluate(el=>el.scrollLeft);
  const diagnostic=await gallery.evaluate(el=>({
    viewport:el.clientWidth,scrollWidth:el.scrollWidth,loop:el.dataset.caseLoop,
    hovered:el.matches(':hover'),focused:el.contains(document.activeElement),
    reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
    hidden:document.hidden,rect:(()=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})()
  }));
  ck('Home gallery drifts continuously',end-start>15,{start,end,diagnostic});
  const box=await gallery.boundingBox();
  await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5);
  const hovered=await gallery.evaluate(el=>el.scrollLeft);
  await page.waitForTimeout(750);
  ck('Autoplay pauses on hover',Math.abs((await gallery.evaluate(el=>el.scrollLeft))-hovered)<3);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.67,box.y+box.height*.5,{steps:12});
  await page.mouse.up();
  const afterDrag=await gallery.evaluate(el=>el.scrollLeft);
  ck('Home gallery supports mouse drag',Math.abs(afterDrag-hovered)>12,{hovered,afterDrag});
  ck('Drag did not accidentally navigate',new URL(page.url()).pathname==='/');
  const pause=page.locator('[data-case-gallery-motion-toggle]');
  await pause.click();
  ck('Autoplay pause control toggles',await pause.getAttribute('aria-pressed')==='true');
  const stopped=await gallery.evaluate(el=>el.scrollLeft);
  await page.mouse.move(0,0);
  await page.waitForTimeout(700);
  ck('Manual pause stops movement',Math.abs((await gallery.evaluate(el=>el.scrollLeft))-stopped)<3);
  await cards.nth(1).click();
  await page.waitForURL(url=>url.pathname===pageUrl('made-to-be-remembered'));
  await page.waitForSelector('[data-case-experience]');
  ck('Homepage card retains project page transition',new URL(page.url()).pathname===pageUrl('made-to-be-remembered'));
  const quiet=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const quietPage=await quiet.newPage();
  await quietPage.goto(base+'/');
  await quietPage.waitForSelector('[data-concept-ready="true"]');
  const quietRail=quietPage.locator('#case-rail');
  await quietRail.scrollIntoViewIfNeeded();
  const rest=await quietRail.evaluate(el=>el.scrollLeft);
  await quietPage.waitForTimeout(900);
  ck('Reduced motion disables automatic gallery travel',Math.abs((await quietRail.evaluate(el=>el.scrollLeft))-rest)<3);
  await quiet.close();
  await page.goto(base+'/our-work/');
  await page.waitForSelector('.case-index-item');
  const work=page.locator('.case-index-item');
  ck('Our Work has all 3 cases',await work.count()===3);
  for(let i=0;i<routes.length;i++){
   const src=await work.nth(i).locator('img').getAttribute('src');
   await work.nth(i).scrollIntoViewIfNeeded();
   await page.waitForFunction(index=>{const img=document.querySelectorAll('.case-index-item img')[index];return !!img&&img.complete&&img.naturalWidth>0},i,{timeout:10000});
   ck('Our Work featured photo matches '+routes[i],src===expected[routes[i]],src);
   ck('Our Work image loads '+routes[i],await work.nth(i).locator('img').evaluate(i=>i.complete&&i.naturalWidth>0));
  }
  ck('No browser errors',!errors.length,errors);
  await context.close();
 }finally {
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/home-work-carousel.json',JSON.stringify(checks,null,2));
  if(checks.some(c=>!c.pass))process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
