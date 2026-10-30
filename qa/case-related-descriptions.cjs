// Guard the scoped related-case-study card typography and text-column width.
// Cards should fill their available space, without affecting other body copy.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const cases=['atmosphere-is-everything','made-to-be-remembered','provault'];
const checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail||'')};
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  for(const width of [1796,1440,768,390,320]){
   await page.setViewportSize({width,height:950});
   for(const slug of cases){
    const route='/work/'+slug+'/';
    await page.goto(base+route);
    await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    await page.waitForSelector('.case-related-card-caption p');
    await page.evaluate(()=>document.fonts.ready);
    const readings=await page.locator('.case-related-card').evaluateAll(cards=>cards.map(card=>{
     const caption=card.querySelector('.case-related-card-caption');
     const content=caption?.querySelector(':scope > div');
     const title=content?.querySelector('h3');
     const paragraph=content?.querySelector('p');
     const arrow=caption?.querySelector(':scope > span');
     if(!caption||!content||!title||!paragraph||!arrow)return null;
     const bounds=el=>{const r=el.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width}};
     return {caption:bounds(caption),content:bounds(content),paragraph:bounds(paragraph),arrow:bounds(arrow),
       title:bounds(title),font:getComputedStyle(paragraph).fontSize,
       headingFont:getComputedStyle(title).fontSize,copy:paragraph.textContent.trim()};
    }));
    ck('Two related cards exist '+route+' @'+width,readings.length===2&&readings.every(Boolean));
    readings.forEach((item,index)=>{
     if(!item)return;
     const label=route+' card '+(index+1)+' @'+width;
     ck('Only related-card copy is 14px '+label,item.font==='14px',item.font);
     ck('Card description fills available width '+label,
       item.paragraph.width>=item.caption.width-item.arrow.width-24&&
       Math.abs(item.paragraph.width-item.content.width)<2,
       {paragraph:item.paragraph.width,caption:item.caption.width,arrow:item.arrow.width,content:item.content.width});
     ck('Related heading retains larger size '+label,parseFloat(item.headingFont)>14,item.headingFont);
     ck('Card copy and title retain left alignment '+label,
       Math.abs(item.paragraph.x-item.title.x)<2,
       {copyLeft:item.paragraph.x,titleLeft:item.title.x});
     ck('Arrow stays at right without overlapping text '+label,
       item.paragraph.right+15<=item.arrow.x&&Math.abs(item.caption.right-item.arrow.right)<2,
       {paragraphRight:item.paragraph.right,arrowLeft:item.arrow.x,arrowRight:item.arrow.right});
    });
    const regular=await page.locator('.case-body-copy p').first().evaluate(el=>getComputedStyle(el).fontSize);
    ck('Other case-story paragraphs remain 17px '+route+' @'+width,regular==='17px',regular);
    const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
    ck('No page overflow '+route+' @'+width,docWidth<=width+2,{docWidth,width});
    if(slug===cases[0]&&(width===1796||width===390)){
      fs.mkdirSync('qa-results',{recursive:true});
      await page.locator('.case-related').scrollIntoViewIfNeeded();
      await page.screenshot({path:'qa-results/case-related-'+width+'.png',animations:'disabled'});
    }
   }
  }
  ck('No uncaught browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/case-related-descriptions.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(err=>{console.error(err);process.exitCode=1});
