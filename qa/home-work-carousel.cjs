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
  ck('Home has no playback button',await page.locator('#case-carousel [data-case-gallery-motion-toggle], #case-carousel .case-home-motion-toggle').count()===0);
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
  ck('Home gallery supports full-distance mouse drag',Math.abs(afterDrag-hovered)>80,{hovered,afterDrag});
  ck('Drag did not accidentally navigate',new URL(page.url()).pathname==='/');
  await page.mouse.move(0,0);
  await page.waitForTimeout(100);
  const resumeStart=await gallery.evaluate(el=>el.scrollLeft);
  await page.waitForTimeout(950);
  const resumeEnd=await gallery.evaluate(el=>el.scrollLeft);
  ck('Home auto-scroll resumes promptly after mouse moves away',resumeEnd-resumeStart>12,{resumeStart,resumeEnd});
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
  // Local Studio publish preview: modifying a case study's opening photo must
  // update both indices without editing their duplicated image fields.
  // Also exercise a future case study explicitly linked from each work section.
  const published=JSON.parse(fs.readFileSync('content/pages.json','utf8'));
  published['made-to-be-remembered'].caseExperience.openingImage='/media/cases/production-hero.webp';
  const next=structuredClone(published['made-to-be-remembered']);
  next.slug='future-creative-exploration';
  next.route='/work/future-creative-exploration/';
  next.title='Future creative exploration';
  next.publishedAt='2026-10-28T16:00:00Z';
  next.caseExperience.openingImage='/media/cases/identity-hero.webp';
  published[next.slug]=next;
  for(const index of [published.home,published['our-work']]){
   const section=index.sections.find(section=>section.type==='work');
   section.items.push({...structuredClone(section.items[0]),title:next.title,href:next.route,image:'/media/evening.webp'});
  }
  const preview=await browser.newContext({viewport:{width,height:900}});
  await preview.addInitScript(data=>localStorage.setItem('showset-preview-published-pages',JSON.stringify(data)),published);
  const previewPage=await preview.newPage();
  previewPage.on('pageerror',e=>errors.push(e.message));
  await previewPage.goto(base+'/');
  await previewPage.waitForSelector('[data-concept-ready="true"]');
  await previewPage.waitForFunction(()=>document.querySelectorAll('#case-rail > [data-case-slide]').length===4);
  const homePreview=previewPage.locator('#case-rail > [data-case-slide]');
  ck('Studio preview picks up a modified case opening image',await homePreview.nth(1).locator('img').getAttribute('src')==='/media/cases/production-hero.webp');
  ck('Future case uses its own opening image on Home',await homePreview.nth(3).locator('img').getAttribute('src')==='/media/cases/identity-hero.webp');
  ck('Future homepage card keeps its project name and period',(await homePreview.nth(3).getAttribute('aria-label'))==='Explore creative study: '+next.title&&await homePreview.nth(3).locator('h3 .teal-dot').count()===1);
  await previewPage.goto(base+'/our-work/');
  await previewPage.waitForSelector('[data-concept-ready="true"]');
  await previewPage.waitForFunction(()=>document.querySelectorAll('.case-index-item').length===4);
  const workPreview=previewPage.locator('.case-index-item');
  ck('Newly added case leads Our Work',await workPreview.nth(0).getAttribute('href')==='/work/future-creative-exploration/');
  ck('Studio preview picks up modified opening image on Our Work',await workPreview.nth(2).locator('img').getAttribute('src')==='/media/cases/production-hero.webp');
  ck('Future case uses its own opening image on Our Work',await workPreview.nth(0).locator('img').getAttribute('src')==='/media/cases/identity-hero.webp');
  await preview.close();
  // Grow the published preview without inventing public projects. Confirm
  // the interactive six-at-a-time contract, newest-first dates and filtering.
  const expanded=structuredClone(published);
  for(let i=0;i<9;i++){
   const clone=structuredClone(published['made-to-be-remembered']);
   clone.slug='qa-new-story-'+i;
   clone.route='/work/'+clone.slug+'/';
   clone.title='QA new story '+i;
   clone.publishedAt=new Date(Date.UTC(2026,9,28,18,0,i)).toISOString();
   clone.caseExperience={...clone.caseExperience,demo:false,tags:[i%2?'Digital':'Events']};
   expanded[clone.slug]=clone;
  }
  const expandedContext=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await expandedContext.addInitScript(data=>localStorage.setItem('showset-preview-published-pages',JSON.stringify(data)),expanded);
  const expandedPage=await expandedContext.newPage();
  await expandedPage.goto(base+'/our-work/');
  await expandedPage.waitForSelector('[data-concept-ready="true"]');
  await expandedPage.waitForFunction(()=>document.querySelectorAll('.work-portfolio-card').length===13);
  ck('Newest dated case is first in gallery',await expandedPage.locator('.work-portfolio-card').first().getAttribute('href')==='/work/qa-new-story-8/');
  ck('Only six visible before Load more',await expandedPage.locator('.work-portfolio-card:visible').count()===6);
  ck('Load more is offered when more than six match',await expandedPage.locator('[data-work-more]').isVisible());
  await expandedPage.locator('[data-work-more-button]').click();
  ck('Load more reveals six additional stories',await expandedPage.locator('.work-portfolio-card:visible').count()===12);
  await expandedPage.locator('[data-work-filter="Digital"]').click();
  ck('Digital tag filter shows only matching studies',await expandedPage.locator('.work-portfolio-card:visible').count()===4 &&
   await expandedPage.locator('.work-portfolio-card:visible').evaluateAll(nodes=>nodes.every(n=>n.dataset.workTags?.split('|').includes('Digital'))));
  ck('Filter change resets pagination and hides Load more',await expandedPage.locator('[data-work-more]').isHidden());
  await expandedPage.locator('[data-work-filter="all"]').click();
  ck('All category resets to newest six',await expandedPage.locator('.work-portfolio-card:visible').count()===6);
  await expandedContext.close();
  ck('No browser errors',!errors.length,errors);
  await context.close();
 }finally {
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/home-work-carousel.json',JSON.stringify(checks,null,2));
  if(checks.some(c=>!c.pass))process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
