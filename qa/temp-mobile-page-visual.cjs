/* Temporary visual-only QA: capture rendered production build on phone/tablet. */
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
(async()=>{
const browser=await chromium.launch({channel:'chromium',headless:true});let errors=[],records=[];
const pages=[['events','/events-experiences/'],['creative','/creative-design/'],['digital','/digital-marketing/'],['production','/content-production/'],['studio','/our-studio/'],['work','/our-work/'],['contact','/contact/'],['case','/work/atmosphere-is-everything/']];
for(const width of [320,390,768]){
 const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<=600,hasTouch:width<=600});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push({width,url:p.url(),error:e.message}));
 for(const [name,url] of pages){
  try {
   await p.goto(base+url,{waitUntil:'domcontentloaded',timeout:30000});
   await p.waitForSelector('.concept-12-root[data-concept-ready=true]',{timeout:12000});
   await p.evaluate(()=>document.fonts.ready);
   await p.waitForTimeout(250);
   const d=await p.evaluate(()=>{
    const q=s=>document.querySelector(s),rect=s=>{const x=q(s);if(!x)return null;const r=x.getBoundingClientRect(),z=getComputedStyle(x);return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),font:z.fontSize,line:z.lineHeight,display:z.display}};
    return {overflow:document.documentElement.scrollWidth-innerWidth,hero:rect('.service-hero'),creative:rect('.service-hero--creative .service-hero-art'),digital:rect('.service-hero--digital .service-digital-art'),studio:rect('.studio-hero-photo'),contact:rect('.contact-intro>p'),action:rect('.service-hero-actions'),headline:rect('.service-heading')};
   });
   const nameKey=name+':'+width;records.push({name,width,...d});console.log('MOBILE_CHECK:'+JSON.stringify({name,width,...d}));
   if(d.overflow>3)errors.push({width,url,overflow:d.overflow});
   if(width===390||width===768||width===320&&['creative','digital','studio','contact'].includes(name)){
    const bytes=await p.screenshot({type:'jpeg',quality:48,animations:'disabled'});
    const s=bytes.toString('base64');console.log('SCREEN_START:'+nameKey);
    for(let i=0;i<s.length;i+=12000)console.log('SCREEN_CHUNK:'+nameKey+':'+s.slice(i,i+12000));
    console.log('SCREEN_END:'+nameKey);
   }
  }catch(e){errors.push({name,width,error:e.message})}
 }
 await ctx.close();
}
await browser.close();
console.log('MOBILE_SUMMARY:'+JSON.stringify({records,errors}));
if(errors.length){console.error('Mobile screenshot browser errors:',errors);process.exitCode=1}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
