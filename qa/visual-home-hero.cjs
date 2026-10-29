const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
(async()=>{
const browser=await chromium.launch({channel:'chromium',headless:true});
const results=[];let failed=false;
try{
 for(const [width,height] of [[320,568],[390,700],[390,844],[600,844],[768,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<=600,isMobile:width<=600});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3001/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-concept-ready="true"]');
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(380);
  const info=await page.evaluate(()=>{
    const rect=q=>{let e=document.querySelector(q),r=e?.getBoundingClientRect();return r?{x:r.left,y:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
    const photo=rect('.hero-photo'),title=rect('.hero-title'),copy=rect('.hero-foreground>p'),buttons=rect('.hero-links');
    const el=document.querySelector('.hero-foreground');
    return {photo,title,copy,buttons,style:{top:getComputedStyle(el).top,translate:getComputedStyle(el).translate,transform:getComputedStyle(el).transform},docWidth:document.documentElement.scrollWidth};
  });
  const inImage=width>600||(
    info.photo&&info.title&&info.copy&&info.buttons&&
    info.title.y>=info.photo.y+8&&info.copy.y>=info.title.bottom-2&&
    info.buttons.y>=info.copy.bottom-2&&info.buttons.bottom<=info.photo.bottom+10);
  const result={width,height,info,errors,withinPhoto:inImage};
  results.push(result);if(!inImage||info.docWidth>width+2||errors.length)failed=true;
  fs.mkdirSync('qa-results/mobile-hero-review',{recursive:true});
  const key='hero-'+width+'-'+height;
  const jpeg=await page.screenshot({type:'jpeg',quality:72,animations:'disabled'});
  fs.writeFileSync('qa-results/mobile-hero-review/'+key+'.jpg',jpeg);
  const encoded=jpeg.toString('base64');
  console.log('HERO_BEGIN:'+key+':'+encoded.length);
  for(let n=0;n<encoded.length;n+=10000)console.log('HERO_CHUNK:'+key+':'+encoded.slice(n,n+10000));
  console.log('HERO_END:'+key);
  if((width===390&&height===844)||(width===320&&height===568)){
   for(const point of [.6,.75,.88]){
    await page.evaluate(point=>{
     const e=document.querySelector('#hero-track');
     scrollTo({top:e.getBoundingClientRect().top+scrollY+Math.max(0,e.offsetHeight-innerHeight)*point,behavior:'instant'});
    },point);
    await page.waitForTimeout(670);
    const opacity=await page.locator('#hero-second').evaluate(el=>parseFloat(getComputedStyle(el).opacity));
    if(point===.6&&opacity>.01)failed=true;
    if(point===.88&&opacity<.99)failed=true;
    console.log('HERO_SCROLL_STATE:'+width+'-'+height+':'+point+':'+opacity);
    if(point===.88){
      const columns=await page.locator('#hero-second h2 .wipe-line').evaluateAll(nodes=>nodes.map(el=>{
        const r=el.getBoundingClientRect(),parent=el.closest('h2').getBoundingClientRect();
        return {left:r.left,right:r.right,centre:(r.left+r.right)/2,parentCentre:(parent.left+parent.right)/2};
      }));
      console.log('HERO_SECOND_HEADING_LINES:'+width+'-'+height+':'+JSON.stringify(columns));
      if(columns.some(col=>Math.abs(col.centre-col.parentCentre)>3))failed=true;
    }
    const second=await page.screenshot({type:'jpeg',quality:72,animations:'disabled'});
    const encoded2=second.toString('base64'),key2=key+'-scroll-'+point;
    console.log('HERO_BEGIN:'+key2+':'+encoded2.length);
    for(let n=0;n<encoded2.length;n+=10000)console.log('HERO_CHUNK:'+key2+':'+encoded2.slice(n,n+10000));
    console.log('HERO_END:'+key2);
   }
  }
  await context.close();
 }
}finally{await browser.close();}
console.log('HERO_DIAGNOSTICS:'+JSON.stringify(results));
if(failed)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
