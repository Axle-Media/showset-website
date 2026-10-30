// Homepage animation and typography parity checks at desktop and mobile sizes.
// In particular, the dot reveals *readable* text as its circular mask grows.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
const check=(name,ok,detail)=>{checks.push({name,pass:!!ok,detail});console.log(ok?'PASS':'FAIL',name,detail??'')};
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [320,390,768,1440,1895]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/');
   await page.waitForSelector('[data-concept-ready=true]');
   await page.evaluate(()=>document.fonts.ready);
   const geometry=await page.evaluate(()=>{
    const lines=[...document.querySelectorAll('.hero-title > .line')];
    const hero=document.querySelector('.hero-foreground').getBoundingClientRect();
    const service=document.querySelector('.services-panel-heading');
    const first=service.children[0],second=service.children[1];
    const period=second.querySelector('.service-heading-accent-period');
    const lastWord=second.firstChild;
    const wordRange=document.createRange();
    const wordStart=lastWord.textContent.lastIndexOf('team');
    wordRange.setStart(lastWord,wordStart);
    wordRange.setEnd(lastWord,wordStart+4);
    const wordRect=wordRange.getBoundingClientRect();
    const periodRect=period.getBoundingClientRect();
    const dot=document.querySelector('.dot-stage > .dot-words');
    const overlay=document.querySelector('.dot-colour-reveal .dot-words');
    const wordmark=document.querySelector('.footer .brand .approved-wordmark');
    const textBounds=lines.map(line=>{
      const range=document.createRange();
      range.selectNodeContents(line.querySelector(':scope > span'));
      return {row:line.getBoundingClientRect().width,text:range.getBoundingClientRect().width};
    });
    const rect=el=>{
      const r=el.getBoundingClientRect();
      return {x:r.left,y:r.top,width:r.width,height:r.height};
    };
    return {
      heroWidth:hero.width,swipes:textBounds,
      headingService:{
        first:getComputedStyle(first).color,
        period:getComputedStyle(first.querySelector('.service-heading-period')).color,
        second:getComputedStyle(second).color,
        last:getComputedStyle(period).color,
        lastDisplay:getComputedStyle(period).display,
        lastWordTop:wordRect.top,
        lastWordRight:wordRect.right,
        periodTop:periodRect.top,
        periodLeft:periodRect.left,
      },
      dotText:dot.querySelector('h2').textContent,
      overlayText:overlay.querySelector('h2').textContent,
      dotLines:dot.querySelector('h2 br')?1:0,
      dotSize:parseFloat(getComputedStyle(dot.querySelector('h2')).fontSize),
      dotCentre:getComputedStyle(dot.querySelector('h2')).textAlign,
      dotRect:rect(dot),overlayRect:rect(overlay),
      dotBaseColour:getComputedStyle(dot.querySelector('.dot-line-primary')).color,
      dotAccentColour:getComputedStyle(dot.querySelector('.dot-line-accent')).color,
      dotEmphasisColour:getComputedStyle(dot.querySelector('em')).color,
      dotPeriods:[...dot.querySelectorAll('h2 em span')].map(n=>getComputedStyle(n).color),
      dotParagraphSize:parseFloat(getComputedStyle(dot.querySelector('p')).fontSize),
      dotParagraphLineHeight:parseFloat(getComputedStyle(dot.querySelector('p')).lineHeight),
      dotParagraphWeight:getComputedStyle(dot.querySelector('p')).fontWeight,
      dotParagraphColour:getComputedStyle(dot.querySelector('p')).color,
      dotParagraphFamily:getComputedStyle(dot.querySelector('p')).fontFamily,
      dotRevealedColour:getComputedStyle(overlay.querySelector('.dot-line-primary')).color,
      dotRevealedAccent:getComputedStyle(overlay.querySelector('.dot-line-accent')).color,
      dotRevealedPeriods:[...overlay.querySelectorAll('h2 em span')].map(n=>getComputedStyle(n).color),
      dotOverlayParagraphSize:parseFloat(getComputedStyle(overlay.querySelector('p')).fontSize),
      dotOverlayParagraphWeight:getComputedStyle(overlay.querySelector('p')).fontWeight,
      dotOverlayParagraphColour:getComputedStyle(overlay.querySelector('p')).color,
      dotOverlayParagraphFamily:getComputedStyle(overlay.querySelector('p')).fontFamily,
      overlayA11yHidden:overlay.closest('[aria-hidden]')?.getAttribute('aria-hidden'),
      footerWidth:wordmark.getBoundingClientRect().width,
      documentWidth:document.documentElement.scrollWidth
    };
   });
   check('Hero block swipe hugs its actual text '+width,
      geometry.swipes.length===2 && geometry.swipes.every(({row,text})=>Math.abs(row-text)<12),geometry.swipes);
   if(width>=768)check('Hero bars are shorter than the full heading column '+width,
      geometry.swipes.every(({row})=>row<geometry.heroWidth*.9),geometry.swipes);
   check('First service line ivory with teal period, second teal with ivory period '+width,
      ['first','period','second','last'].map(k=>geometry.headingService[k]).join('|')===
      ['rgb(250, 249, 253)','rgb(18, 186, 175)','rgb(18, 186, 175)','rgb(250, 249, 253)'].join('|'),geometry.headingService);
   check('Final ivory period stays directly after team rather than on its own line '+width,
      geometry.headingService.lastDisplay==='inline' &&
      Math.abs(geometry.headingService.lastWordTop-geometry.headingService.periodTop)<3 &&
      Math.abs(geometry.headingService.lastWordRight-geometry.headingService.periodLeft)<4,
      geometry.headingService);
   check('Dot copy and its clipped twin have identical content and positions '+width,
      geometry.dotText===geometry.overlayText && geometry.dotLines===1 &&
      Math.abs(geometry.dotRect.x-geometry.overlayRect.x)<2 &&
      Math.abs(geometry.dotRect.y-geometry.overlayRect.y)<2 &&
      Math.abs(geometry.dotRect.width-geometry.overlayRect.width)<2 &&
      geometry.overlayA11yHidden==='true',geometry);
   check('Dot headline is centred and remains large '+width,
      geometry.dotCentre==='center' && geometry.dotSize>=(width>1200?65:width>600?38:29),{
        fontSize:geometry.dotSize,alignment:geometry.dotCentre
      });
   check('Dot typography retains turquoise lead-in, sand emphasis and turquoise periods '+width,
      geometry.dotBaseColour==='rgb(18, 186, 175)' &&
      geometry.dotAccentColour==='rgb(18, 186, 175)' &&
      geometry.dotEmphasisColour==='rgb(229, 216, 195)' &&
      geometry.dotPeriods.length>=2 &&
      geometry.dotPeriods.every(color=>color==='rgb(18, 186, 175)'),geometry);
   check('Dot supporting text is prominent, including inside colour reveal '+width,
      geometry.dotParagraphSize>=18 &&
      geometry.dotParagraphSize<=23.5 &&
      geometry.dotParagraphLineHeight>=geometry.dotParagraphSize*1.45 &&
      Math.abs(geometry.dotParagraphSize-geometry.dotOverlayParagraphSize)<1,geometry);
   check('Dot supporting copy remains equally bold and aligned through colour transition '+width,
      geometry.dotParagraphWeight==='700' &&
      geometry.dotOverlayParagraphWeight==='700' &&
      geometry.dotParagraphFamily===geometry.dotOverlayParagraphFamily &&
      geometry.dotParagraphColour==='rgb(250, 249, 253)' &&
      geometry.dotOverlayParagraphColour==='rgb(6, 38, 58)',{
        before:{weight:geometry.dotParagraphWeight,color:geometry.dotParagraphColour,font:geometry.dotParagraphFamily},
        after:{weight:geometry.dotOverlayParagraphWeight,color:geometry.dotOverlayParagraphColour,font:geometry.dotOverlayParagraphFamily}
      });
   check('Revealed dot text and punctuation remain readable on teal '+width,
      geometry.dotRevealedColour==='rgb(6, 38, 58)' &&
      geometry.dotRevealedAccent==='rgb(6, 38, 58)' &&
      geometry.dotRevealedPeriods.length>=2 &&
      geometry.dotRevealedPeriods.every(color=>color==='rgb(250, 249, 253)'),geometry);
   check('Footer approved wordmark enlarged without horizontal overflow '+width,
      geometry.footerWidth>=(width>800?250:width>600?225:205) &&
      geometry.documentWidth<=width+2,{
        logo:geometry.footerWidth,doc:geometry.documentWidth
      });
   // Actual scroll-driven dot growth must clip the inverted copy to precisely
   // the same radius as the original teal circle, in both directions.
   await page.evaluate(()=>{
     const el=document.querySelector('#dot-track');
     scrollTo({top:scrollY+el.getBoundingClientRect().top+Math.max(0,el.offsetHeight-innerHeight)*.9,behavior:'instant'});
   });
   await page.waitForTimeout(230);
   const scene=await page.evaluate(()=>{
     const stage=document.querySelector('.dot-stage');
     const dot=document.querySelector('#dot-core');
     const over=document.querySelector('.dot-colour-reveal');
     return {radius:parseFloat(stage.style.getPropertyValue('--dot-radius')),
       circle:getComputedStyle(dot).clipPath,copy:getComputedStyle(over).clipPath};
   });
   check('Dot colour reveal follows the expanding circle '+width,
     scene.radius>200 && scene.circle===scene.copy,scene);
   await page.evaluate(()=>{
     const el=document.querySelector('#dot-track');
     scrollTo({top:scrollY+el.getBoundingClientRect().top-innerHeight,behavior:'instant'});
   });
   await page.waitForTimeout(230);
   const reset=await page.locator('.dot-stage').evaluate(el=>parseFloat(el.style.getPropertyValue('--dot-radius')||'0'));
   check('Dot radius resets when scrolling back '+width,reset===0,reset);
   if([390,1440].includes(width)){
     fs.mkdirSync('qa-results/homepage-parity',{recursive:true});
     await page.goto(base+'/');
     await page.waitForSelector('[data-concept-ready=true]');
     await page.screenshot({path:'qa-results/homepage-parity/hero-'+width+'.png'});
     await page.evaluate(()=>{
       const el=document.querySelector('#dot-track');
       scrollTo({top:scrollY+el.getBoundingClientRect().top+Math.max(0,el.offsetHeight-innerHeight)*.9,behavior:'instant'});
     });
     await page.waitForTimeout(230);
     await page.screenshot({path:'qa-results/homepage-parity/dot-'+width+'.png'});
   }
   await ctx.close();
  }
  check('No browser errors',errors.length===0,errors);
 } finally{
   await browser.close();
   fs.mkdirSync('qa-results',{recursive:true});
   fs.writeFileSync('qa-results/homepage-motion-parity.json',JSON.stringify({checks,errors},null,2));
   if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
