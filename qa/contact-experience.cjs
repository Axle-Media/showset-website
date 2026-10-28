// Contact-page contract: editorial, accessible, honest, and consistent across viewports.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
const ck=(name,ok,detail)=>{checks.push({name,pass:!!ok,detail});console.log(ok?'PASS':'FAIL',name,detail||'')};
(async()=>{
 fs.mkdirSync('qa-results/contact',{recursive:true});
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try {
  for(const width of [1440,800,390,320]){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:width===320?'reduce':'no-preference'});
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('mailto'))errors.push(m.text())});
   await page.goto(base+'/contact/');
   await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
   ck('Contact has two concise sections '+width,await page.locator('.view.is-current[data-view="contact"]>section').count()===2);
   const meta=await page.locator('.view.is-current').evaluate(view=>{
    const head=view.querySelector('.contact-editorial-heading');
    const form=view.querySelector('.contact-form');
    const first=head?.querySelector('.plain-line:first-child');
    const second=head?.querySelector('.accent-text');
    const period=head?.querySelector('.service-period');
    const photo=view.querySelector('.contact-photo img');
    const s=x=>x?getComputedStyle(x):null;
    return {first:s(first)?.color,second:s(second)?.color,period:s(period)?.color,
      headlineAnimation:s(head)?.animationName,headlineOpacity:s(head)?.opacity,
      formBackground:s(form)?.backgroundColor,formBorder:s(form)?.borderTopWidth,
      photoLoaded:photo?.complete&&photo?.naturalWidth>0,
      viewport:document.documentElement.scrollWidth,screen:innerWidth,
      visibleInputs:[...form.querySelectorAll('input:not([name="website"]),textarea')].every(x=>s(x).display!=='none')};
   });
   ck('Contact uses approved static ivory/teal heading '+width,meta.first==='rgb(250, 249, 253)'&&meta.second==='rgb(18, 186, 175)'&&meta.period==='rgb(250, 249, 253)'&&meta.headlineAnimation==='none'&&meta.headlineOpacity==='1',meta);
   ck('Contact integrated form has no card '+width,meta.formBackground==='rgba(0, 0, 0, 0)'&&meta.formBorder==='0px',meta);
   ck('Contact photograph loaded '+width,meta.photoLoaded,meta);
   ck('Contact fits viewport '+width,meta.viewport<=width+1,{width,scrollWidth:meta.viewport});
   ck('Contact has direct contact alternatives '+width,await page.locator('.contact-direct-link[href^="mailto:"]').count()===1&&await page.locator('.contact-direct-link[href^="tel:"]').count()===1);
   const valid=await page.locator('#contact-form').evaluate(f=>({required:[...f.querySelectorAll('[required]')].map(x=>x.name),novalidate:f.noValidate}));
   ck('Only three core fields required '+width,JSON.stringify(valid.required)===JSON.stringify(['name','email','message'])&&!valid.novalidate,valid);
   await page.locator('#contact-form button[type="submit"]').click();
   ck('Required fields block empty enquiry '+width,!(await page.locator('#form-result').innerText()));
   await page.locator('#full-name').fill('Test Visitor');
   await page.locator('#email').fill('test@example.com');
   await page.locator('#message').fill('We have a project idea for SHOWSET and would love to talk about it.');
   await page.locator('#project-trigger').click();
   await page.locator('.select-option[data-value="A website or digital solution"]').click();
   ck('Project type can be selected '+width,await page.locator('#project-type').inputValue()==='A website or digital solution');
   // Prevent external mail-handler launch during QA, but still test draft contents.
   await page.evaluate(()=>document.addEventListener('click',e=>{
    if(e.target.closest('.contact-draft-link'))e.preventDefault();
   },true));
   await page.locator('#contact-form button[type="submit"]').click();
   const draft=await page.locator('#form-result').evaluate(node=>({
    status:node.textContent,href:node.querySelector('a')?.getAttribute('href')
   }));
   ck('Email fallback is honest '+width,draft.status.includes('Nothing has been submitted')&&draft.href?.startsWith('mailto:hello@showset.co.za?'),draft);
   ck('Prepared enquiry includes entered details '+width,draft.href?.includes('Test%20Visitor')&&draft.href?.includes('A%20website%20or%20digital%20solution')&&draft.href?.includes('test%40example.com'));
   if([1440,390].includes(width))await page.screenshot({path:'qa-results/contact/contact-'+width+'.png',fullPage:true});
   await ctx.close();
  }
  ck('No browser exceptions',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.writeFileSync('qa-results/contact-experience.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
