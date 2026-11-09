// Homepage editorial transition: title, body, CTA must appear as one
// reading column in DOM and onscreen, like the conversation closing CTA.
// Mobile retains its existing centred composition.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[],errors=[];
function ck(label,ok,detail){
  results.push({label,pass:!!ok,detail});
  console.log(ok?'PASS':'FAIL',label,ok?'':JSON.stringify(detail));
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,768,1024,1440,1802]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   page.on('pageerror',err=>errors.push({width,error:err.message}));
   await page.goto(base+'/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   await page.evaluate(()=>document.fonts.ready);
   const state=await page.locator('.view.is-current #discover').evaluate(section=>{
     const group=section.querySelector('.manifesto-heading-group');
     const title=group?.querySelector(':scope > h2');
     const copy=group?.querySelector(':scope > .manifesto-copy');
     const body=copy?.querySelector(':scope > p');
     const button=group?.querySelector(':scope > .understated-link');
     const r=el=>{const b=el?.getBoundingClientRect();return b&&{top:b.top,bottom:b.bottom,left:b.left,right:b.right,centerX:(b.left+b.right)/2}};
     return {
       order:[...group.children].map(el=>el.tagName.toLowerCase()+'.'+el.className),
       title:r(title),body:r(body),button:r(button),group:r(group),
       titleCopy:title?.innerText?.replace(/\s+/g,' ').trim(),
       bodyCopy:body?.textContent?.trim(),
       buttonCopy:button?.textContent?.replace(/\s+/g,' ').trim(),
       href:button?.getAttribute('href'),
       textAlign:getComputedStyle(body).textAlign,
       scrollWidth:document.documentElement.scrollWidth,
     };
   });
   const tag=' @'+width+'px';
   ck('Accessible heading-body-link DOM order'+tag,
     state.order.length===3&&state.order[0].startsWith('h2.')&&
     state.order[1].includes('manifesto-copy')&&state.order[2].includes('understated-link'),state);
   ck('Heading, body and CTA stacked vertically'+tag,
     state.body.top>=state.title.bottom-2&&state.button.top>=state.body.bottom-2,state);
   if(width>800){
     ck('Three elements share one left text edge'+tag,
       Math.abs(state.title.left-state.body.left)<=3&&Math.abs(state.body.left-state.button.left)<=3,state);
   }else{
     ck('Mobile/tablet elements share a central axis'+tag,
       Math.abs(state.title.centerX-state.group.centerX)<=4&&
       Math.abs(state.body.centerX-state.group.centerX)<=4&&
       Math.abs(state.button.centerX-state.group.centerX)<=4&&state.textAlign==='center',state);
   }
   ck('Approved copy and link preserved'+tag,
     state.titleCopy==='Too good to leave on the drawing board.'&&
     state.bodyCopy==='We live for the moment an idea clicks. Then we bring it to life, down to the last detail.'&&
     state.buttonCopy.startsWith('Meet the people behind it')&&state.href==='/our-studio/',state);
   ck('No horizontal overflow'+tag,state.scrollWidth<=width+2,state);
   await page.close();
  }
  ck('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/home-manifesto-stacked-layout.json',JSON.stringify({results,errors},null,2));
  if(results.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
