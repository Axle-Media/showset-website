// Browser QA: every homepage service preview reflects authored copy,
// its real destination, and the common "Discover more" CTA.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const expected=[
 ['Events & experiences','Conferences, launches and celebrations, delivered with precision.','/events-experiences/'],
 ['Creative & design','Brand identities with a distinct point of view.','/creative-design/'],
 ['Digital & marketing','Websites and campaigns that engage and convert.','/digital-marketing/'],
 ['Content & production','Film, photography, motion and live production.','/content-production/']
];
const results=[];
function ck(label,ok,details){
  results.push({label,pass:!!ok,details});
  console.log(ok?'PASS':'FAIL',label,details||'');
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   await page.goto(base+'/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   for(let i=0;i<expected.length;i++){
    const [name,copy,href]=expected[i];
    // Focus selection works with keyboard as well as pointer/scroll, and
    // does not navigate away from the Home service scene.
    await page.locator('[data-service="'+(i===0?1:i-1)+'"]').focus();
    await page.locator('[data-service="'+i+'"]').focus();
    await page.waitForFunction(expected=>document.querySelector('#service-visual-copy')?.textContent===expected,copy,{timeout:5000});
    const current=await page.locator('#service-visual-copy').innerText();
    const link=page.locator('#service-visual-link');
    ck(name+' description @'+width,current===copy,current);
    ck(name+' CTA text @'+width,(await link.innerText()).trim().startsWith('Discover more'));
    ck(name+' destination @'+width,await link.getAttribute('href')===href);
    ck(name+' accessible label @'+width,(await link.getAttribute('aria-label')||'').startsWith('Discover more about'));
   }
   await page.close();
  }
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/home-services-director-copy.json',JSON.stringify(results,null,2));
  if(results.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
