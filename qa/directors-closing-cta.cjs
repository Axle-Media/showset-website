// Directors' closing-CTA content and direct email-form navigation.
// Intentionally tests current published templates, not the Studio editor.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const expected='Have an idea worth bringing to life?';
const expectedBody='The brief can be polished, half-written or still living entirely in your head. Tell us what you are trying to make happen. We know where to start.';
const results=[],errors=[];
function ck(label,ok,details){
  results.push({label,pass:!!ok,details});
  console.log(ok?'PASS':'FAIL',label,details??'');
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   page.on('pageerror',err=>errors.push({width,url:page.url(),message:err.message}));
   await page.goto(base+'/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   const approach=page.locator('.view.is-current .dot-stage');
   ck('Home approach heading retained @'+width,
     (await approach.locator('.dot-words h2').first().innerText()).includes('Wild about the possibilities.'));
   ck('Both dot colour layers have no supporting copy @'+width,
     await approach.locator('.dot-words > p:visible').count()===0);
   for(const [route,selector,headingSel,buttonSel,copySel] of [
    ['/', '#ending','h2','.end-link','.end-bottom > p'],
    ['/our-studio/', '.studio-final','.studio-editorial-heading','.editorial-action','.studio-final-copy'],
    ['/work/the-amaze-ball/','#case-ending','h2','.end-link','.end-bottom > p']]){
    if(route!=='/'){
      await page.goto(base+route);
      await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    }
    const section=page.locator('.view.is-current').locator(selector).first();
    const heading=(await section.locator(headingSel).innerText()).replace(/\s+/g,' ').trim();
    const button=section.locator(buttonSel);
    ck('Closing heading matches new wording '+route+' @'+width,heading===expected,heading);
    const copy = section.locator(copySel);
    ck('Closing paragraph restored '+route+' @'+width,
      await copy.isVisible() && (await copy.innerText()).replace(/\s+/g,' ').trim()===expectedBody);
    ck('Start a conversation CTA label '+route+' @'+width,
      (await button.innerText()).trim().startsWith('Start a conversation'));
    ck('CTA goes straight to email form '+route+' @'+width,
      await button.getAttribute('href')==='/contact/#contact-form');
   }
   await page.goto(base+'/contact/#contact-form');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   const reached=await page.waitForFunction(()=>{
     const form=document.querySelector('.view.is-current #contact-form');
     if(!form)return false;
     const r=form.getBoundingClientRect();
     return r.width>0&&r.top>=0&&r.top<innerHeight;
   },null,{timeout:6000}).then(()=>true).catch(()=>false);
   ck('Direct contact link lands on visible email form @'+width,reached,
     await page.evaluate(()=>({url:location.pathname+location.hash,
       top:document.querySelector('.view.is-current #contact-form')?.getBoundingClientRect().top})));
   ck('Contact form has required email entry @'+width,
     await page.locator('.view.is-current #contact-form input[type="email"]').count()===1);
   ck('No horizontal viewport overflow @'+width,
     await page.evaluate(w=>document.documentElement.scrollWidth<=w+2,width));
   await page.close();
  }
  ck('No script errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/directors-closing-cta.json',JSON.stringify({results,errors},null,2));
  if(results.some(r=>!r.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
