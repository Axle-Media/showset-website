// Canonical visual parity contract for all four services and Our Studio.
// Browser-computed values must match the Studio reference at each viewport.
const { chromium }=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const routes=[
  ['/events-experiences/','.service-close--editorial','.service-heading','.service-close-description p','.end-link.solid-link'],
  ['/creative-design/','.service-close--editorial','.service-heading','.service-close-description p','.end-link.solid-link'],
  ['/digital-marketing/','.service-close--editorial','.service-heading','.service-close-description p','.end-link.solid-link'],
  ['/content-production/','.service-close--editorial','.service-heading','.service-close-description p','.end-link.solid-link'],
  ['/our-studio/','.studio-final-pattern','.studio-editorial-heading','.studio-final-copy p','.editorial-action.solid-link']
];
const checks=[];
const pass=(name,ok,data)=>{checks.push({name,pass:!!ok,data});console.log(ok?'PASS':'FAIL',name,ok?'':JSON.stringify(data));};
function near(a,b,eps=1.5){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=eps;}
(async()=>{
 fs.mkdirSync('qa-results/closing-cta',{recursive:true});
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
 for(const width of [390,768,1440,1895]){
  const screenshots=[];
  for(const [path,section,heading,paragraph,button] of routes){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const page=await context.newPage();
   await page.goto(base+path);
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   await page.evaluate(()=>document.fonts.ready);
   const result=await page.evaluate(({section,heading,paragraph,button})=>{
    const root=document.querySelector('.view.is-current');
    const s=root.querySelector(section);
    const h=s?.querySelector(heading),p=s?.querySelector(paragraph),a=s?.querySelector(button);
    if(!s||!h||!p||!a)return {missing:true,details:[!!s,!!h,!!p,!!a]};
    const H=getComputedStyle(h),P=getComputedStyle(p),A=getComputedStyle(a),S=getComputedStyle(s),BG=getComputedStyle(s,'::before');
    const rect=n=>{const r=n.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height}};
    return {
      route:location.pathname,
      headingText:h.textContent?.trim(),
      heading:rect(h),paragraph:rect(p),button:rect(a),section:rect(s),
      headingFont:H.fontSize,headingWeight:H.fontWeight,headingLineHeight:H.lineHeight,
      headingTracking:H.letterSpacing,headingTextAlign:H.textAlign,
      bodyFont:P.fontSize,bodyLineHeight:P.lineHeight,
      buttonFont:A.fontSize,buttonRadius:A.borderRadius,
      buttonColor:A.backgroundColor,buttonTextColor:A.color,
      sectionPaddingTop:S.paddingTop,sectionPaddingBottom:S.paddingBottom,
      sectionBackground:S.backgroundImage,
      pattern:BG.backgroundImage,patternSize:BG.backgroundSize,
      patternPosition:BG.backgroundPosition,patternOpacity:BG.opacity,
      patternRepeat:BG.backgroundRepeat,patternLayer:BG.zIndex,
      firstColor:getComputedStyle(h.querySelector('.plain-line')).color,
      secondColor:getComputedStyle(h.querySelector('.accent-text')).color,
      punctuation:getComputedStyle(h.querySelector('.service-period')).color,
      documentOverflow:document.documentElement.scrollWidth-innerWidth
    };
   },{section,heading,paragraph,button});
   pass('Closing CTA elements exist '+path+' @'+width,!result.missing,result);
   if(!result.missing){
     pass('Closing CTA correct pattern '+path+' @'+width,
      result.pattern.includes('/media/studio-cta-pattern.svg')&&result.patternRepeat==='no-repeat'&&result.patternLayer==='0'&&
      result.firstColor==='rgb(250, 249, 253)'&&result.secondColor==='rgb(18, 186, 175)'&&result.punctuation==='rgb(250, 249, 253)',result);
     pass('Closing CTA no horizontal overflow '+path+' @'+width,result.documentOverflow<=1,result.documentOverflow);
   }
   if([390,1440,1895].includes(width)&&!result.missing){
    await page.locator(section).scrollIntoViewIfNeeded();
    await page.locator(section).screenshot({path:'qa-results/closing-cta/'+path.replaceAll('/','').replaceAll('-','_')+'-'+width+'.png'});
   }
   screenshots.push(result);
   await context.close();
  }
  const studio=screenshots[4];
  for(const entry of screenshots.slice(0,4)){
   if(entry.missing||studio.missing)continue;
   const metrics=['headingFont','headingWeight','headingLineHeight','headingTracking','headingTextAlign',
      'bodyFont','bodyLineHeight','buttonFont','buttonRadius','buttonColor','buttonTextColor',
      'sectionPaddingTop','sectionPaddingBottom','sectionBackground',
      'pattern','patternSize','patternPosition','patternOpacity','patternRepeat','patternLayer'];
   const different=metrics.filter(key=>entry[key]!==studio[key]).map(key=>({key,actual:entry[key],reference:studio[key]}));
   pass('Service matches Studio typography, pattern, CTA styling '+entry.route+' @'+width,
      different.length===0,different);
   const position={
    title:near(entry.heading.x,studio.heading.x),body:near(entry.paragraph.x,studio.paragraph.x),
    button:near(entry.button.x,studio.button.x),
    headingY:near(entry.heading.y-entry.section.y,studio.heading.y-studio.section.y),
    sectionHeight:near(entry.section.h,studio.section.h,300) // longer authored service copy is allowed
   };
   pass('Closing CTA content uses same left/top placement '+entry.route+' @'+width,
    Object.values(position).every(Boolean),position);
  }
 }
 } finally {
   await browser.close();
   fs.writeFileSync('qa-results/closing-cta-parity.json',JSON.stringify(checks,null,2));
   if(checks.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
