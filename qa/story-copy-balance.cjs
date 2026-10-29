// Story copy sizing and overflow regression for all three Home film chapters
// and the two photographic Our Studio hero scenes.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
function ck(name,ok,detail){checks.push({name,pass:!!ok,detail});console.log(ok?'PASS':'FAIL',name,detail??'')}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [320,390,768,1440,1895]){
   const ctx=await browser.newContext({viewport:{width,height:900}});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   for(const route of ['/','/our-studio/']){
    await page.goto(base+route);
    await page.waitForSelector('[data-concept-ready=true]');
    await page.evaluate(()=>document.fonts.ready);
    const chapters=await page.locator(route==='/'?'.view.is-current .film-step':'.view.is-current .studio-hero-scene').evaluateAll(nodes=>nodes.map(el=>{
      const title=el.querySelector('h1,h2'),p=el.querySelector('p');
      const heading=title.getBoundingClientRect(),copy=p.getBoundingClientRect();
      const style=getComputedStyle(p);
      return {heading:title.textContent.replace(/\s+/g,' ').trim(),
       copy:p.textContent.trim(),words:p.textContent.trim().split(/\s+/).length,
       pWidth:copy.width,pHeight:copy.height,px:copy.left,right:copy.right,
       headingEnd:heading.bottom,copyStart:copy.top,
       fontSize:parseFloat(style.fontSize),lineHeight:parseFloat(style.lineHeight),
       pMaxWidth:style.maxWidth};
    }));
    const expectedCount=route==='/'?3:2;
    ck('Story chapters retained '+route+' '+width,chapters.length===expectedCount,chapters.map(c=>c.heading));
    ck('Expanded substantial copy '+route+' '+width,
      chapters.every(c=>c.words>=36&&c.words<=56),chapters.map(c=>c.words));
    ck('Wider desktop text boxes while mobile follows available space '+route+' '+width,
      chapters.every(c=>width>=1000?c.pWidth>=640&&c.pWidth<=665:width>=650?c.pWidth>=540&&c.pWidth<=665:c.pWidth>=220&&c.pWidth<width),chapters.map(c=>({heading:c.heading,width:c.pWidth})));
    ck('No heading or paragraph overlap, and readable body size '+route+' '+width,
      chapters.every(c=>c.copyStart>=c.headingEnd-2&&c.fontSize>=16.5&&c.lineHeight>=24),chapters);
    ck('Story text fits viewport width '+route+' '+width,
      chapters.every(c=>c.px>=0&&c.right<=width+2)&&
      await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),chapters.map(c=>({left:c.px,right:c.right})));
    if([390,1440].includes(width)){
      fs.mkdirSync('qa-results/story-copy',{recursive:true});
      await page.screenshot({path:'qa-results/story-copy/'+(route==='/'?'home':'studio')+'-'+width+'.png',animations:'disabled'});
    }
   }
   await ctx.close();
  }
  ck('No JavaScript errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/story-copy-balance.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(c=>!c.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
