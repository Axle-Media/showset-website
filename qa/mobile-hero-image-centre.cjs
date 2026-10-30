// Home and Our Studio: mobile hero CONTENT (heading, copy and CTAs) must
// remain centred over their photographic frames as the frames expand.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const results=[],errors=[];
function ck(name,pass,detail){results.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'');}
const scenarios=[
  {name:'Home',url:'/',track:'#hero-track',stage:'#hero-stage',photo:'#hero-photo',
   first:'#hero-foreground',second:'#hero-second'},
  {name:'Our Studio',url:'/our-studio/',track:'[data-studio-hero-track]',
   stage:'.studio-hero-stage',photo:'[data-studio-hero-photo]',
   first:'[data-studio-hero-first]',second:'[data-studio-hero-follow]'}
];
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [375,390,430]){
   const context=await browser.newContext({viewport:{width,height:740},reducedMotion:'no-preference'});
   const page=await context.newPage();
   page.on('pageerror',e=>errors.push({width,url:page.url(),error:e.message}));
   for(const scenario of scenarios){
    await page.goto(base+scenario.url);
    await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    await page.evaluate(()=>document.fonts.ready);
    for(const [phase,progress,target] of [['first',0,scenario.first],['second',.86,scenario.second]]){
     await page.evaluate(({track,progress})=>{
      const el=document.querySelector(track);
      const top=window.scrollY+el.getBoundingClientRect().top;
      window.scrollTo({top:top+Math.max(0,el.offsetHeight-innerHeight)*progress,behavior:'instant'});
     },{track:scenario.track,progress});
     await page.waitForTimeout(160);
     const geometry=await page.evaluate(({stage,photo,target})=>{
      const frame=document.querySelector(photo);
      const text=document.querySelector(target);
      const container=document.querySelector(stage);
      const fr=frame.getBoundingClientRect(),tx=text.getBoundingClientRect(),
            st=container.getBoundingClientRect();
      const title=text.querySelector('h1,h2'),line=title?.getBoundingClientRect();
      const css=getComputedStyle(text);
      return {
       x:Math.abs(fr.left+fr.width/2-(tx.left+tx.width/2)),
       y:Math.abs(fr.top+fr.height/2-(tx.top+tx.height/2)),
       titleX:line?Math.abs(fr.left+fr.width/2-(line.left+line.width/2)):null,
       align:title?getComputedStyle(title).textAlign:null,
       stage:{top:st.top,height:st.height},
       photo:{top:fr.top,height:fr.height},
       content:{top:tx.top,height:tx.height},
       translate:css.translate
      };
     },{stage:scenario.stage,photo:scenario.photo,target});
     const tag=scenario.name+' '+phase+' @'+width;
     ck('Hero content centres horizontally over photo '+tag,geometry.x<=5,geometry);
     ck('Hero content centres vertically inside photo '+tag,geometry.y<=16,geometry);
     ck('Hero heading is centred '+tag,geometry.align==='center'&&geometry.titleX<=5,geometry);
     ck('No page-wide overflow '+tag,await page.evaluate(w=>document.documentElement.scrollWidth<=w+3,width));
    }
   }
   await context.close();
  }
  ck('No browser errors',!errors.length,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/mobile-hero-image-centre.json',JSON.stringify({results,errors},null,2));
  if(results.some(r=>!r.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
