// SHOWSET Studio, portfolio and Contact acceptance. No hardcoded portfolio size.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[],errors=[];
function ck(name,pass,detail){checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')}
(async()=>{
 fs.mkdirSync('qa-results/editorial',{recursive:true});
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
 for(const width of [1440,800,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:width===320?'reduce':'no-preference'});
  const page=await context.newPage();
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base+'/our-studio/');
  await page.waitForSelector('[data-concept-ready="true"]');
  ck('Studio five purposeful sections '+width,await page.locator('.view.is-current[data-view="studio"]>section').count()===5);
  ck('Studio has live discipline links '+width,await page.locator('.view.is-current .studio-capability-links a').count()===4);
  const chapters=await page.locator('.view.is-current .studio-storyboard-chapter').evaluateAll(nodes=>nodes.map(chapter=>({
    title:chapter.querySelector('h3')?.textContent,
    copy:chapter.querySelector('p')?.textContent,
    image:chapter.querySelector('img')?.getAttribute('src'),
    headingVisible:getComputedStyle(chapter.querySelector('h3')).opacity==='1',
    copyVisible:getComputedStyle(chapter.querySelector('p')).opacity==='1'
  })));
  ck('Studio photographic chapters with immediately readable copy '+width,
    chapters.length===3&&chapters.every(x=>x.title&&x.copy&&x.image&&x.headingVisible&&x.copyVisible),
    chapters);
  ck('Studio no old photo-selector accordion '+width,
    await page.locator('.view.is-current [data-studio-choice]').count()===0);
  for(const n of [0,1,2]){
    const photo=page.locator('.view.is-current .studio-storyboard-shot').nth(n);
    // Simulate normal user scrolling to the visible chapter wrapper, not
    // Playwright's scroll-into-view logic on a fully masked photograph.
    await page.locator('.view.is-current .studio-storyboard-chapter').nth(n).evaluate(el=>
      window.scrollTo({top:window.scrollY+el.getBoundingClientRect().top-window.innerHeight*.25,behavior:'instant'})
    );
    await page.waitForTimeout(width===320?150:1100);
    const state=await photo.evaluate(el=>({
      loaded:el.querySelector('img')?.complete&&el.querySelector('img')?.naturalWidth>0,
      motion:el.closest('[data-studio-storyboard]')?.dataset.studioStoryboardMotion,
      revealed:el.classList.contains('is-visible'),
      clip:getComputedStyle(el).clipPath
    }));
    ck('Studio photo storyboard reveal '+width+' '+n,state.loaded&&
      (width===320?(state.motion!=='on'):state.revealed&&(!state.clip||state.clip.includes('0px')||state.clip==='inset(0px)')),
      state);
  }
  const ending=await page.locator('.view.is-current .studio-final').evaluate(el=>({
    heading:el.querySelector('h2')?.textContent,
    background:getComputedStyle(el,'::before').backgroundImage,
    repeat:getComputedStyle(el,'::before').backgroundRepeat,
    size:getComputedStyle(el,'::before').backgroundSize,
    layer:getComputedStyle(el,'::before').zIndex
  }));
  ck('Studio approved oversized nonrepeating graphic behind closing CTA '+width,
    ending.heading?.includes('complicated idea')&&ending.background.includes('studio-cta-pattern.svg')&&ending.repeat==='no-repeat'&&ending.layer==='0',
    ending);
  ck('Studio CTA links to Contact '+width,await page.locator('.view.is-current .studio-final .editorial-action').getAttribute('href')==='/contact/');
  ck('Studio no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if([1440,390].includes(width))await page.screenshot({path:'qa-results/editorial/studio-'+width+'.png',fullPage:true});
  await page.goto(base+'/our-work/');
  await page.waitForSelector('[data-concept-ready="true"]');
  ck('Portfolio four-section journey '+width,await page.locator('.view.is-current[data-view="work"]>section').count()===4);
  const portfolio=await page.locator('.view.is-current .work-portfolio-card').evaluateAll(nodes=>nodes.map(n=>({
   href:n.getAttribute('href'),title:n.querySelector('h2')?.textContent,
   label:n.querySelector('.work-feature-type')?.textContent,
   category:n.dataset.workCategory,
   image:n.querySelector('img')?.getAttribute('src'),
   copy:n.querySelector('.case-index-info p')?.textContent
  })));
  ck('Portfolio derives valid linked stories '+width,portfolio.length>=3&&portfolio.every(x=>x.href?.startsWith('/work/')&&x.title&&x.image&&x.copy),portfolio.slice(0,4));
  ck('Initial demonstration cases are clearly labelled '+width,portfolio.slice(0,3).every(x=>x.label==='Concept study'),portfolio.slice(0,3).map(x=>x.label));
  const intro=await page.locator('.work-intro-copy').innerText();
  ck('Work intro does not hardcode case-study count '+width,!/three creative studies|only three|not completed client projects/i.test(intro),intro);
  ck('All Work cards reuse the homepage card shell '+width,
    await page.locator('.view.is-current .case-index-item').evaluateAll(nodes=>
      nodes.every(n=>n.classList.contains('case-slide')&&n.querySelector('.case-photo')&&n.querySelector('.case-story'))));
  const layout=await page.locator('.view.is-current .case-index').evaluate(el=>({
    columns:getComputedStyle(el).gridTemplateColumns.split(' ').length,
    width:innerWidth,
    viewportHeight:innerHeight,
    heroHeight:document.querySelector('.view.is-current .work-hero').getBoundingClientRect().height,
    filters:[...document.querySelectorAll('.view.is-current [data-work-filter]')].map(x=>x.textContent),
    visible:[...el.querySelectorAll('.work-portfolio-card')].filter(n=>!n.hidden).length
  }));
  ck('Work hero is shorter than full screen '+width,layout.heroHeight<layout.viewportHeight*.8,layout);
  ck('Grid has expected columns '+width,layout.columns===(width>1100?3:width>600?2:1),layout);
  ck('Tag filters follow requested taxonomy '+width,
    layout.filters.join('|')==='All|Events|Creative|Digital|Content',layout.filters);
  ck('Initial gallery shows up to six cases '+width,layout.visible===Math.min(6,portfolio.length),layout.visible);
  await page.locator('.view.is-current [data-work-filter="Digital"]').click();
  ck('Unpopulated category has clear empty-state '+width,
    await page.locator('[data-work-empty]').isVisible()&&
    await page.locator('.view.is-current .work-portfolio-card:visible').count()===0);
  await page.locator('.view.is-current [data-work-filter="All"]').click();
  ck('All filter restores original cards '+width,
    await page.locator('.view.is-current .work-portfolio-card:visible').count()===Math.min(6,portfolio.length));
  ck('Work remains readable without hover '+width,await page.locator('.view.is-current .case-index-info p').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).visibility==='visible'&&getComputedStyle(n).opacity==='1')));
  ck('Work CTA links to Contact '+width,await page.locator('.view.is-current .work-final .editorial-action').getAttribute('href')==='/contact/');
  ck('Work no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if([1440,390].includes(width))await page.screenshot({path:'qa-results/editorial/work-'+width+'.png',fullPage:true});
  await page.goto(base+'/contact/');
  await page.waitForSelector('[data-concept-ready="true"]');
  ck('Compact Contact single composition '+width,await page.locator('.view.is-current[data-view="contact"]>section').count()===1);
  ck('Direct email and phone are visible '+width,await page.locator('.view.is-current [data-contact-email]').getAttribute('href')==='mailto:hello@showset.co.za'&&await page.locator('.view.is-current [data-contact-phone]').getAttribute('href')?.then(x=>x.startsWith('tel:+27')));
  const fields=await page.locator('#contact-form').evaluate(form=>({required:[...form.querySelectorAll('[required]')].map(x=>x.name),optionalCollapsed:!form.querySelector('.contact-extra').open}));
  ck('Only name, email and message required '+width,JSON.stringify(fields.required)===JSON.stringify(['name','email','message'])&&fields.optionalCollapsed,fields);
  await page.locator('#contact-form button[type="submit"]').click();
  ck('Invalid Contact blocked '+width,!(await page.locator('#form-result').innerText()));
  await page.locator('#full-name').fill('SHOWSET Test');
  await page.locator('#email').fill('visitor@example.com');
  await page.locator('#message').fill('Testing a new creative project.');
  await page.locator('#project-trigger').click();
  await page.locator('.select-option[data-value="An event or experience"]').click();
  await page.evaluate(()=>document.addEventListener('click',event=>{
   if(event.target.closest('.contact-draft-link'))event.preventDefault();
  },true));
  await page.locator('#contact-form button[type="submit"]').click();
  const draft=await page.locator('#form-result').evaluate(node=>({
   text:node.textContent,href:node.querySelector('a')?.getAttribute('href')
  }));
  ck('Contact does not falsely claim a message was delivered '+width,draft.text.includes('Nothing has been submitted')&&draft.href?.startsWith('mailto:hello@showset.co.za?'),draft);
  ck('Prepared email includes visitor details '+width,draft.href?.includes('SHOWSET%20Test')&&draft.href?.includes('visitor%40example.com'));
  ck('Contact no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if([1440,390].includes(width))await page.screenshot({path:'qa-results/editorial/contact-'+width+'.png',fullPage:true});
  await context.close();
 }
 ck('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.writeFileSync('qa-results/editorial-pages.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
