// Measure every repeated heading + paragraph editorial row after the column
// width adjustment. Checks real Chromium layout, not just source selectors.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[];
function ck(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail||'')}
const sections=[
 {route:'/',items:[
  ['Home manifesto','.manifesto-grid','.manifesto-heading-group h2','.manifesto-copy > p'],
  ['Home featured work','#portfolio-section .portfolio-heading','.section-title','.portfolio-intro p'],
 ]},
 {route:'/our-studio/',items:[
  ['Studio belief','.studio-belief','h2',':scope > p'],
  ['Studio partnerships','.studio-partnership','h2',':scope > div > p'],
  ['Studio FAQ','.studio-faq-heading','h2',':scope > p'],
  ['Studio closing invitation','.studio-final-inner','h2',':scope > p'],
 ]},
 ...['/events-experiences/','/creative-design/','/digital-marketing/','/content-production/'].map(route=>({
  route,items:[['Service feature','.category-feature','h2',':scope > p']],
 }))
];
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1440,1600,1920,768,390]){
   await page.setViewportSize({width,height:900});
   for(const entry of sections){
    await page.goto(base+entry.route,{waitUntil:'domcontentloaded'});
    await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    const rows=await page.evaluate(specs=>specs.map(([name,container,heading,copy])=>{
     const wrap=document.querySelector('.view.is-current '+container);
     if(!wrap)return {name,error:'Section not found'};
     const h=wrap.querySelector(heading),p=wrap.querySelector(copy);
     if(!h||!p)return {name,error:'Heading or paragraph not found'};
     const a=h.getBoundingClientRect(),b=p.getBoundingClientRect(),box=wrap.getBoundingClientRect();
     const style=getComputedStyle(wrap);
     const cols=style.gridTemplateColumns.split(/\s+/).map(parseFloat);
     return {name,display:style.display,columns:cols,paragraphWidth:b.width,headingLeft:a.left,
       headingRight:a.right,paragraphLeft:b.left,paragraphRight:b.right,
       parentLeft:box.left,parentRight:box.right,font:getComputedStyle(p).fontSize};
    }),entry.items);
    for(const row of rows){
     const prefix=row.name+' @'+width;
     ck('Editorial row exists '+prefix,!row.error,row.error);
     if(row.error)continue;
     if(width>=1001){
      const second=row.columns?.[1],expected=Math.min(760,second||0);
      ck('Two-column editorial row '+prefix,row.display==='grid'&&row.columns.length===2,row.columns);
      ck('Paragraph fills available right column '+prefix,row.paragraphWidth>=expected-4,
       {width:row.paragraphWidth,rightTrack:second,target:expected});
      ck('Columns do not overlap '+prefix,row.paragraphLeft>=row.headingRight+16,
       {headingEnd:row.headingRight,copyStart:row.paragraphLeft});
     }else{
      ck('Editorial row remains stacked on mobile/tablet '+prefix,row.columns.length===1,row.columns);
      ck('Mobile paragraph stays in viewport '+prefix,row.paragraphLeft>=-1&&row.paragraphRight<=width+1,row);
     }
     ck('Paragraph retains approved 17px '+prefix,row.font==='17px',row.font);
    }
    const viewport=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth}));
    ck('No horizontal overflow '+entry.route+' @'+width,viewport.documentWidth<=width+2,viewport);
    if(width===1440&&entry.route==='/'){
     const h=await page.locator('.hero-title .line').evaluateAll(els=>els.map(el=>el.textContent.trim()).join(' '));
     ck('Approved hero headline unchanged',h==='Great ideas move people.',h);
    }
   }
  }
  ck('No browser exceptions',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/editorial-columns.json',JSON.stringify(checks,null,2));
  if(checks.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(error=>{console.error(error);process.exitCode=1});
