// Verify route changes snap to the top WHILE the transition curtain covers
// the viewport, never exposing a smooth journey through scroll-driven scenes.
// Public routes use the same client router; in-page anchor links remain smooth.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail||'')};
const expectedHash='#discover';

(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>errors.push(e.message));
  const instrument=()=>page.evaluate(()=>{
    const curtain=document.querySelector('#route-curtain');
    const proof={entered:false,left:false,atReveal:null,scrollAfterReveal:[]};
    window.__showsetRouteTopProof=proof;
    const observer=new MutationObserver(()=>{
      if(curtain.classList.contains('enter'))proof.entered=true;
      if(curtain.classList.contains('leave')&&!proof.left){
        proof.left=true;proof.atReveal=scrollY;
      }
    });
    observer.observe(curtain,{attributes:true,attributeFilter:['class']});
    const handle=()=>{if(proof.left)proof.scrollAfterReveal.push(scrollY)};
    window.addEventListener('scroll',handle,{passive:true});
    window.__showsetDisposeRouteTopProof=()=>{observer.disconnect();window.removeEventListener('scroll',handle)};
  });
  async function assertTransition(label,expectedPath,act){
    await instrument();
    const start=await page.evaluate(()=>scrollY);
    ck(label+' starts scrolled down',start>500,{start});
    await act();
    await page.waitForFunction(()=>window.__showsetRouteTopProof?.left,null,{timeout:6500});
    const snapshot=await page.evaluate(()=>({proof:window.__showsetRouteTopProof,route:document.querySelector('.concept-12-root')?.dataset.conceptRoute,path:location.pathname,y:scrollY,restoration:history.scrollRestoration}));
    ck(label+' entered an animated curtain',snapshot.proof.entered,snapshot.proof);
    ck(label+' switched to expected route',snapshot.path===expectedPath,{actual:snapshot.path,expectedPath});
    ck(label+' was AT TOP before reveal',snapshot.proof.atReveal<=1,{atReveal:snapshot.proof.atReveal,start});
    ck(label+' remains at top during reveal',snapshot.y<=1,{duringReveal:snapshot.y});
    ck(label+' disables native scroll restoration',snapshot.restoration==='manual',snapshot.restoration);
    await page.waitForFunction(()=>{const c=document.querySelector('#route-curtain');return !c.classList.contains('enter')&&!c.classList.contains('leave')},null,{timeout:4000});
    const final=await page.evaluate(()=>{
       const p=window.__showsetRouteTopProof;
       return {y:scrollY,maxScroll:Math.max(0,...p.scrollAfterReveal)};
    });
    ck(label+' never animates scroll after reveal',final.y<=1&&final.maxScroll<=2,final);
    await page.evaluate(()=>window.__showsetDisposeRouteTopProof?.());
  }
  const deep=()=>page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight-innerHeight-120,left:0,behavior:'instant'}));
  await page.goto(base+'/');
  await page.waitForSelector('[data-concept-ready="true"]');
  ck('In-page anchors retain CSS smooth-scroll',await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='smooth');
  await deep();
  await assertTransition('Deep Home to Events','/events-experiences/',()=>page.locator('.desktop-navigation a[href="/events-experiences/"]').click());
  await deep();
  await assertTransition('Deep Events to Our Work','/our-work/',()=>page.locator('.desktop-navigation a[href="/our-work/"]').click());
  await deep();
  await assertTransition('Deep Work to Studio','/our-studio/',()=>page.locator('.desktop-navigation a[href="/our-studio/"]').click());

  // Browser back and forward must not reintroduce the previous route's offset.
  await deep();
  await assertTransition('Back from deep Studio to Work','/our-work/',()=>page.evaluate(()=>history.back()));
  await deep();
  await assertTransition('Forward from deep Work to Studio','/our-studio/',()=>page.evaluate(()=>history.forward()));

  // Case-study cards use the same router, but have separate pinned scrolling scenes.
  await page.goto(base+'/work/atmosphere-is-everything/');
  await page.waitForSelector('[data-concept-ready="true"]');
  await deep();
  await assertTransition('Deep case study to related case','/work/made-to-be-remembered/',()=>page.locator('.case-related-card[href="/work/made-to-be-remembered/"]').click());
  await deep();
  await assertTransition('Deep case study to Home','/',()=>page.locator('#site-header .brand[href="/"]').click());

  // Clicking the current route again should jump immediately, not traverse
  // the homepage's long pinned animations.
  await deep();
  const beforeSame=await page.evaluate(()=>scrollY);
  await page.locator('#site-header .brand[href="/"]').click();
  const same=await page.evaluate(()=>scrollY);
  ck('Current-page navigation resets immediately',beforeSame>500&&same<=1,{beforeSame,same});

  // Hash-section navigation is intentionally NOT changed to an instant snap.
  ck('Page still uses smooth anchor scrolling',await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='smooth');

  // Reduced-motion route changes also snap to top without a curtain.
  const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const rp=await reduced.newPage();
  await rp.goto(base+'/'); await rp.waitForSelector('[data-concept-ready="true"]');
  await rp.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight-innerHeight-120,behavior:'instant'}));
  const reducedBefore=await rp.evaluate(()=>scrollY);
  await rp.locator('.desktop-navigation a[href="/creative-design/"]').click();
  await rp.waitForFunction(()=>document.querySelector('.concept-12-root')?.dataset.conceptRoute==='creative');
  ck('Reduced-motion navigation still starts at top',reducedBefore>500&&(await rp.evaluate(()=>scrollY))<=1,{reducedBefore,after:await rp.evaluate(()=>scrollY)});
  await reduced.close();
  ck('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/instant-route-top.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(item=>!item.pass)||errors.length)process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
