const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3002';
const out=process.env.SHOWSET_STORY_EVIDENCE_DIR||'qa-results/storytelling';
const checks=[],errors=[];
const check=(name,pass)=>{checks.push({name,pass:!!pass});console.log(pass?'PASS':'FAIL',name)};
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const viewport of[{width:1440,height:650},{width:1024,height:690}]){
   const page=await browser.newPage({viewport});page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/work/atmosphere-is-everything/');
   await page.waitForSelector('[data-case-ready=true]');await page.evaluate(()=>document.fonts.ready);
   check('Readable fallback '+viewport.width+'x'+viewport.height,await page.locator('[data-case-experience]').evaluate(e=>e.hasAttribute('data-case-flow')));
   check('All chapters visible in fallback '+viewport.height,await page.locator('[data-case-chapter]').evaluateAll(es=>es.every(e=>!e.inert&&getComputedStyle(e).visibility==='visible'&&getComputedStyle(e).opacity==='1')));
   await page.locator('[data-case-chapter="0"]').scrollIntoViewIfNeeded();
   await page.screenshot({path:path.join(out,'short-'+viewport.width+'x'+viewport.height+'.png')});await page.close();
  }
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/work/atmosphere-is-everything/');await page.waitForSelector('[data-case-ready=true]');
  await page.locator('[data-case-chapter="0"]').scrollIntoViewIfNeeded();
  const client=await context.newCDPSession(page),before=await page.evaluate(()=>scrollY);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:190,y:650}]});
  for(let y=620;y>=200;y-=30){await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:190,y}]});await page.waitForTimeout(16)}
  await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);
  check('Native touch scroll advances readable mobile page',await page.evaluate(()=>scrollY)>before+100);
  check('Touch flow keeps all chapters accessible',await page.locator('[data-case-chapter]').evaluateAll(es=>es.every(e=>!e.inert&&e.getAttribute('aria-hidden')!=='true')));
  await context.close();
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  await desktop.goto(base+'/work/atmosphere-is-everything/');await desktop.waitForSelector('[data-case-ready=true]');
  await desktop.emulateMedia({reducedMotion:'reduce'});await desktop.waitForFunction(()=>!document.querySelector('[data-case-experience]').hasAttribute('data-case-ready'));
  check('Live reduced motion exposes all text',await desktop.locator('[data-case-chapter]').evaluateAll(es=>es.every(e=>!e.inert&&e.getAttribute('aria-hidden')!=='true')));
  await desktop.emulateMedia({reducedMotion:'no-preference'});await desktop.waitForSelector('[data-case-ready=true]');
  check('Motion restores one shared frame',await desktop.locator('.case-story-visual').isVisible());await desktop.close();
  check('No fallback runtime exceptions',errors.length===0);
 }finally{await browser.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'fallbacks.json'),JSON.stringify(checks,null,2));if(checks.some(x=>!x.pass))process.exitCode=1}
})().catch(e=>{console.error(e);process.exitCode=1});
