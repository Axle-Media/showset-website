// Editorial page contract: short journeys, visible copy and accessible photography.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')};
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [1440,800,390,320]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:width===320?'reduce':'no-preference'});
   const page=await context.newPage();
   page.on('pageerror',err=>errors.push(err.message));
   await page.goto(base+'/our-studio/');
   await page.waitForSelector('[data-concept-ready="true"]');
   ck('Studio five-section journey '+width,await page.locator('.view.is-current[data-view="studio"]>section').count()===5);
   ck('Studio not padded with FAQ and generic process cards '+width,await page.locator('.view.is-current .studio-faq,.view.is-current .rhythm-grid,.view.is-current .values').count()===0);
   ck('Studio copy and all stage descriptions are visible '+width,await page.locator('.view.is-current .studio-story-entry p').evaluateAll(nodes=>nodes.length===3&&nodes.every(node=>getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility==='visible'&&getComputedStyle(node).opacity==='1')));
   for(const n of [2,1,0]){
    await page.locator('.view.is-current [data-studio-choice="'+n+'"]').click();
    const result=await page.locator('.view.is-current .studio-exploration').evaluate(section=>({
      activeFrames:[...section.querySelectorAll('[data-studio-frame].is-active')].map(e=>e.dataset.studioFrame),
      pressed:[...section.querySelectorAll('[data-studio-choice][aria-pressed="true"]')].map(e=>e.dataset.studioChoice)
    }));
    ck('Studio photo selection '+width+' '+n,result.activeFrames.length===1&&result.activeFrames[0]===String(n)&&result.pressed.length===1&&result.pressed[0]===String(n),result);
   }
   await page.locator('[data-studio-choice="1"]').focus();
   ck('Studio keyboard focus selects photo '+width,await page.locator('[data-studio-choice="1"]').getAttribute('aria-pressed')==='true');
   ck('Studio CTA links to contact '+width,await page.locator('.view.is-current .studio-final .editorial-action').getAttribute('href')==='/contact/');
   ck('Studio viewport fits '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.goto(base+'/our-work/');
   await page.waitForSelector('[data-concept-ready="true"]');
   ck('Work curated journey '+width,await page.locator('.view.is-current[data-view="work"]>section').count()===4);
   const cards=await page.locator('.view.is-current .work-feature').evaluateAll(nodes=>nodes.map(node=>({
     href:node.getAttribute('href'),title:node.querySelector('h2')?.textContent,description:node.querySelector('p')?.textContent,
     image:node.querySelector('img')?.getAttribute('src')
   })));
   ck('Work retains three accessible and attributed studies '+width,
    cards.length===3&&cards.every(c=>c.href?.startsWith('/work/')&&c.title&&c.description&&c.image),cards);
   ck('Creative study disclaimer remains explicit '+width,
    (await page.locator('.view.is-current .work-intro-copy').innerText()).includes('not completed client projects'));
   ck('Work CTA links to contact '+width,await page.locator('.view.is-current .work-final .editorial-action').getAttribute('href')==='/contact/');
   ck('Work viewport fits '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   ck('All Work information visible without hover '+width,await page.locator('.view.is-current .work-feature p').evaluateAll(nodes=>nodes.length===3&&nodes.every(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n).visibility==='visible')));
   await context.close();
  }
  ck('No page errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/editorial-pages.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
