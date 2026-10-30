// Related case study regression: canonical Our Work titles, title-only cards,
// accessible project links and visually centred phone cards.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const routes=['the-amaze-ball','made-to-be-remembered','provault'];
const results=[],errors=[];
const check=(label,pass,detail)=>{results.push({label,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',label,detail??'')};
const normal=s=>(s||'').replace(/\s+/g,' ').trim();
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/our-work/');
  await page.waitForSelector('.case-index-item');
  const titles=Object.fromEntries(await page.locator('.case-index-item').evaluateAll(cards=>cards.map(c=>[
    new URL(c.href).pathname, c.querySelector('h2')?.textContent?.replace(/\s+/g,' ').trim()
  ])));
  check('Our Work exposes all canonical project titles',routes.every(slug=>titles['/work/'+slug+'/']));
  for(const width of [390,600,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const slug of routes){
    const route='/work/'+slug+'/';
    await page.goto(base+route);
    await page.waitForSelector('[data-concept-ready="true"]');
    await page.waitForSelector('.case-related-card');
    await page.evaluate(()=>document.fonts.ready);
    const observed=await page.locator('.case-related-card').evaluateAll(cards=>cards.map(card=>{
      const link=new URL(card.href).pathname;
      const title=card.querySelector('.case-related-card-caption h3');
      const description=card.querySelector('.case-related-card-caption p');
      const arrow=card.querySelector('.case-related-card-caption > span');
      const caption=card.querySelector('.case-related-card-caption');
      const cap=caption?.getBoundingClientRect(),ar=arrow?.getBoundingClientRect();
      return {link,title:title?.dataset.caseHeading?.replace(/\s+/g,' ').trim(),
        description:!!description,alignment:title?getComputedStyle(title).textAlign:null,
        arrow:ar?{x:ar.x+ar.width/2,y:ar.y}:null,
        caption:cap?{x:cap.x+cap.width/2,y:cap.y}:null,
        picture:!!card.querySelector('.case-related-photo img')};
    })));
    const label=route+' @'+width;
    check('Related projects remain two distinct links '+label,observed.length===2&&new Set(observed.map(x=>x.link)).size===2);
    check('Related titles equal Our Work '+label,observed.every(x=>normal(x.title)===normal(titles[x.link])),observed.map(x=>({route:x.link,title:x.title,want:titles[x.link]})));
    check('Related cards contain headings only, not descriptions '+label,observed.every(x=>!x.description&&x.picture));
    if(width<=600){
      check('Related heading and arrow centred '+label,observed.every(x=>
        x.alignment==='center'&&x.arrow&&x.caption&&Math.abs(x.arrow.x-x.caption.x)<=3),observed);
      const heading=await page.locator('.case-related-heading').evaluate(el=>{
       const a=el.querySelector('.understated-link'),r=el.getBoundingClientRect(),l=a?.getBoundingClientRect();
       return {align:getComputedStyle(el).alignItems,gap:Math.abs((l?.x||0)+(l?.width||0)/2-(r.x+r.width/2))};
      });
      check('Explore our work link centred '+label,heading.align==='center'&&heading.gap<=3,heading);
    }
    check('Full original case narratives retained '+label,(await page.locator('.case-body-copy p').count())>=3);
    check('No viewport overflow '+label,await page.evaluate(w=>document.documentElement.scrollWidth<=w+2,width));
   }
  }
  check('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/case-related-descriptions.json',JSON.stringify(results,null,2));
  if(results.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
