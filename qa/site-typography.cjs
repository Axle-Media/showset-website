// Regression tests for site-wide text scale on the published pages.
// Desktop and mobile must retain the approved headings and navigation sizing.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[];
const errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail||'')};
const routes=['/','/events-experiences/','/creative-design/','/digital-marketing/','/content-production/','/our-studio/','/our-work/','/contact/','/work/atmosphere-is-everything/'];
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:900});
   for(const route of routes){
    await page.goto(base+route,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    const actual=await page.evaluate(()=>{
      const root=document.querySelector('.concept-12-root');
      const style=el=>getComputedStyle(el);
      const paragraphs=[...root.querySelectorAll('p,li,blockquote')].filter(el=>!el.closest('.c12-custom-body,.case-related-card-caption'));
      const copy=paragraphs.map(el=>({tag:el.localName,className:el.className,px:style(el).fontSize})).filter(el=>el.px!=='17px');
      const buttons=[...root.querySelectorAll('.solid-link,.header-cta,.text-arrow-link,.understated-link,.end-link,.service-image-information > a,.case-slide-link,.case-explore,.select-trigger,.select-option,.case-home-motion-toggle,.case-gallery-motion-toggle,button[type="submit"]')];
      const wrongButtons=buttons.filter(el=>style(el).fontSize!=='14px').map(el=>({tag:el.localName,className:el.className,size:style(el).fontSize}));
      const nav=[...root.querySelectorAll('.desktop-navigation>.nav-text')].map(el=>style(el).fontSize);
      const input=[...root.querySelectorAll('.contact-form input:not([type="checkbox"]):not([type="radio"]),.contact-form textarea')];
      const wrongInputs=input.filter(el=>style(el).fontSize!=='17px').map(el=>({tag:el.localName,size:style(el).fontSize}));
      return {pCount:paragraphs.length,copy,buttonCount:buttons.length,wrongButtons,wrongInputs,nav,documentWidth:document.documentElement.scrollWidth};
    });
    ck('All paragraphs and list copy are 17px '+route+' @'+width,actual.pCount>0&&actual.copy.length===0,actual.copy.slice(0,8));
    ck('Button and CTA labels are 14px '+route+' @'+width,actual.buttonCount>0&&actual.wrongButtons.length===0,actual.wrongButtons.slice(0,8));
    if(width>=1351) ck('Visible desktop menu typography remains 14px '+route+' @'+width,actual.nav.length===6&&actual.nav.every(s=>s==='14px'));
    ck('Body inputs are 17px '+route+' @'+width,actual.wrongInputs.length===0,actual.wrongInputs);
    ck('No horizontal document overflow '+route+' @'+width,actual.documentWidth<=width+2,actual.documentWidth);
    if(route==='/'){
     const h=await page.locator('.hero-title .line').evaluateAll(elements=>elements.map(el=>el.textContent.trim()).join(' '));
     ck('Approved homepage heading unchanged @'+width,h==='Great ideas move people.',h);
     const hero=await page.locator('.hero-foreground').evaluate(el=>{
       const copy=el.querySelector(':scope > p'),actions=el.querySelector('.hero-links');
       if(!copy||!actions)return false;
       const p=copy.getBoundingClientRect(),a=actions.getBoundingClientRect();
       return p.bottom<=a.top+1;
     });
     ck('Hero paragraph and CTA do not overlap @'+width,hero);
    }
   }
  }
  ck('No browser exceptions',!errors.length,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/site-typography.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
