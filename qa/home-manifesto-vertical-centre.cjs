// Home manifesto spacing: its heading, paragraph and link must be centred
// together within the section, with less empty vertical space and no clipping.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[];
function ck(label,pass,data){
  results.push({label,pass:!!pass,data});
  console.log(pass?'PASS':'FAIL',label,pass?'':JSON.stringify(data));
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,768,850,1024,1440,1802]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   await page.goto(base+'/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   await page.evaluate(()=>document.fonts.ready);
   const g=await page.locator('.view.is-current #discover').evaluate(section=>{
     const content=section.querySelector('.manifesto-grid');
     const heading=section.querySelector('.manifesto-heading-group > h2');
     const paragraph=section.querySelector('.manifesto-copy > p');
     const link=section.querySelector('.manifesto-heading-group > .understated-link');
     const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
     const sec=rect(section),group=rect(content),h=rect(heading),p=rect(paragraph),a=rect(link);
     const s=getComputedStyle(section);
     const range=document.createRange();
     range.selectNodeContents(paragraph);
     const right=Math.max(...[...range.getClientRects()].map(r=>r.right));
     return {
       sectionHeight:sec.height,groupHeight:group.height,
       topSpace:group.top-sec.top,bottomSpace:sec.bottom-group.bottom,
       centred:Math.abs((group.top+group.bottom)-(sec.top+sec.bottom)),
       paddingTop:parseFloat(s.paddingTop),paddingBottom:parseFloat(s.paddingBottom),
       display:s.display,justify:s.justifyContent,
       headingBottom:h.bottom,copyTop:p.top,copyBottom:p.bottom,buttonTop:a.top,
       textRight:right,sectionRight:sec.right,sectionPaddingRight:parseFloat(s.paddingRight),
       text:paragraph.textContent.trim(),href:link.getAttribute('href'),
       docScrollWidth:document.documentElement.scrollWidth
     };
   });
   const label=' @'+width+'px';
   ck('Whole heading/copy/link group is vertically centred'+label,
      g.display==='flex'&&g.justify==='center'&&g.centred<=4,g);
   ck('Reading order and spacing preserved'+label,
      g.copyTop>=g.headingBottom-2&&g.buttonTop>=g.copyBottom-2,g);
   ck('Horizontal text stays inside section'+label,
      g.textRight<=g.sectionRight-g.sectionPaddingRight+2,g);
   ck('Original copy and CTA destination remain'+label,
      g.text==='We live for the moment an idea clicks. Then we bring it to life, down to the last detail.'&&
      g.href==='/our-studio/',g);
   if(width>=801) {
     ck('Reduced section height and padding on desktop'+label,
       g.sectionHeight<=510&&g.paddingTop<=84&&g.paddingBottom<=84,g);
   }
   ck('No horizontal overflow'+label,g.docScrollWidth<=width+2,g);
   await page.close();
  }
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/home-manifesto-vertical-centre.json',JSON.stringify(results,null,2));
  if(results.some(r=>!r.pass))process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
