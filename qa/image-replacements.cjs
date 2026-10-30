// Acceptance: every numbered placement is rendered, loaded and responsive.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const photos=require('../lib/concept-12/image-replacements.json');
const base=process.env.SHOWSET_BASE_URL||'http://localhost:3001';
const routes=[['/',1,10],['/events-experiences/',11,14],['/creative-design/',15,18],['/digital-marketing/',19,22],['/content-production/',23,26],['/our-studio/',27,30],['/our-work/',31,34],['/work/the-amaze-ball/',35,47],['/work/made-to-be-remembered/',48,57],['/work/behind-every-moment/',58,67]];
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 const results=[],errors=[];
 fs.mkdirSync('qa-results/image-replacements',{recursive:true});
 try{
  for(const width of [1440,390]){
   const context=await browser.newContext({viewport:{width,height:900}});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   for(const [route,first,last] of routes){
    await page.goto(base+route);await page.waitForSelector('[data-concept-ready="true"]');
    const actual=await page.locator('.view.is-current img[data-image-placement]').evaluateAll(async images=>{
     images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()));
     return images.map(i=>({id:Number(i.dataset.imagePlacement),src:i.getAttribute('src'),current:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,mobile:i.parentElement.querySelector('source')?.getAttribute('srcset')}));
    });
    const ids=[...new Set(actual.map(i=>i.id))].sort((a,b)=>a-b);
    const replaced={5:201,6:101,32:201,33:101,46:101,66:201,67:101};
    const expected=route==='/work/made-to-be-remembered/'
     ? [56,...Array.from({length:11},(_,i)=>101+i),201]
     : route==='/work/the-amaze-ball/' ? [47,101,...Array.from({length:20},(_,i)=>201+i)]
     : Array.from({length:last-first+1},(_,i)=>replaced[first+i]||first+i).sort((a,b)=>a-b);
    assert.deepEqual(ids,expected,`${route} at ${width}: all current placements`);
    assert(actual.every(i=>i.loaded),`${route}: every image decodes`);
    if(width<768)assert(actual.filter(i=>i.mobile).every(i=>new URL(i.current).pathname===i.mobile),`${route}: art-directed mobile sources`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),`${route}: no horizontal overflow`);
    results.push({route,width,placements:ids,imagesLoaded:actual.length});
    await page.screenshot({path:`qa-results/image-replacements/${first}-${width}.png`});
   }
   // Lightbox next must load the next full photo rather than retain the old srcset.
   await page.goto(base+'/work/the-amaze-ball/');await page.waitForSelector('[data-case-ready="true"]');
   await page.locator('[data-case-image="0"]').click();
   await page.locator('[data-case-lightbox-next]').click();
   await page.waitForFunction(()=>{const i=document.querySelector('[data-case-lightbox-image]');return i.complete&&i.naturalWidth>0&&i.getAttribute('src')?.includes('amaze-ball-impact-edited-v2')});
   assert.equal(await page.locator('[data-case-lightbox-image]').getAttribute('srcset'),null);
   await context.close();
  }
  // Previously saved defaults migrate; an authored custom URL stays unchanged.
  const context=await browser.newContext();
  const previous=require('../lib/concept-12/legacy/pre-image-replacement-pages.json');
  previous.home.sections.find(s=>s.type==='story').items[0].image='/media/brand.webp';
  await context.addInitScript(data=>localStorage.setItem('showset-preview-published-pages',JSON.stringify(data)),previous);
  const page=await context.newPage();await page.goto(base+'/');await page.waitForSelector('[data-concept-ready="true"]');
  assert.equal(await page.locator('#hero-photo img').getAttribute('src'),photos.find(i=>i.placement===1).src);
  assert.equal(await page.locator('[data-film-image="0"] img').getAttribute('src'),'/media/brand.webp');
  assert(await page.evaluate(()=>!!localStorage.getItem('showset-concept12-recovery')),'Migration preserves recovery snapshot');
  await context.close();
  assert.deepEqual(errors,[],'No browser runtime errors');
  console.log('PASS all current placements on desktop/mobile; decoded assets, mobile art direction, lightbox, saved defaults and custom overrides');
 }finally{fs.writeFileSync('qa-results/image-replacements.json',JSON.stringify({results,errors},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
