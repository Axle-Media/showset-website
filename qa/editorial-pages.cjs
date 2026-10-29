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
  ck('Our Work drops obsolete Selected stories heading and explanatory paragraph '+width,
    await page.locator('.view.is-current .work-index-header').count()===0 &&
    !(await page.locator('.view.is-current[data-view="work"]').innerText()).includes("Explore the work and the thinking behind it. New stories will appear here as they're published."));
  ck('Our Work filter controls begin the gallery directly '+width,
    await page.locator('.view.is-current .work-page-gallery > [data-work-filters]').count()===1 &&
    await page.locator('.view.is-current [data-work-filter="all"]').isVisible());
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
  await page.locator('.view.is-current [data-work-filter="all"]').click();
  ck('All filter restores original cards '+width,
    await page.locator('.view.is-current .work-portfolio-card:visible').count()===Math.min(6,portfolio.length));
  ck('Work remains readable without hover '+width,await page.locator('.view.is-current .case-index-info p').evaluateAll(nodes=>nodes.every(n=>getComputedStyle(n).visibility==='visible'&&getComputedStyle(n).opacity==='1')));
  ck('Work CTA links to Contact '+width,await page.locator('.view.is-current .work-final .editorial-action').getAttribute('href')==='/contact/');
  ck('Work no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if([1440,390].includes(width))await page.screenshot({path:'qa-results/editorial/work-'+width+'.png',fullPage:true});
  await page.goto(base+'/contact/');
  await page.waitForSelector('[data-concept-ready="true"]');
  ck('Compact Contact single composition '+width,await page.locator('.view.is-current[data-view="contact"]>section').count()===1);
  ck('Contact opens directly into the left copy and right form, without an additional hero '+width,
    await page.locator('.view.is-current[data-view="contact"] > .contact-view > .contact-shell > .contact-left h1').count()===1 &&
    await page.locator('.view.is-current[data-view="contact"] > .contact-view > .contact-shell > #contact-form').count()===1 &&
    await page.locator('.view.is-current[data-view="contact"] .contact-eyebrow').count()===0 &&
    await page.locator('.view.is-current[data-view="contact"] :is(.contact-hero,.simple-hero,.page-hero)').count()===0);
  ck('Contact copy and all direct channels sit together left of the form '+width,
    await page.locator('.view.is-current .contact-left').evaluate(el=>
      !!el.querySelector('.contact-intro > h1')&&!!el.querySelector('.contact-intro > p')&&
      !!el.querySelector('[data-contact-email]')&&!!el.querySelector('[data-contact-phone]')&&
      !!el.querySelector('[data-contact-whatsapp]')));
  const contactGeometry=await page.locator('.view.is-current .contact-view').evaluate(el=>{
    const shell=el.querySelector('.contact-shell'),card=el.querySelector('.contact-form');
    return {
      minHeight:getComputedStyle(el).minHeight,
      columns:getComputedStyle(shell).gridTemplateColumns.split(' ').length,
      panel:getComputedStyle(card).backgroundColor,
      panelBorder:getComputedStyle(card).borderTopColor,
      inputBg:getComputedStyle(el.querySelector('#full-name')).backgroundColor,
      inputColour:getComputedStyle(el.querySelector('#full-name')).color,
      labelColour:getComputedStyle(el.querySelector('label[for="full-name"]')).color,
      headingLines:[...el.querySelectorAll('h1 .plain-line')].map(node=>node.textContent.trim()),
      bodyLength:el.querySelector('.contact-intro > p')?.textContent?.trim().length,
      panelRadius:parseFloat(getComputedStyle(card).borderTopLeftRadius),
      hasPhoto:!!el.querySelector('.contact-photo'),
      visibleDate:el.querySelector('#project-date')?.getClientRects().length>0,
      visibleBudget:el.querySelector('#project-budget')?.getClientRects().length>0,
      headingSize:parseFloat(getComputedStyle(el.querySelector('h1')).fontSize)
    };
  });
  ck('Contact uses a content-height layout, not a full-screen hero '+width,
    contactGeometry.minHeight==='0px'&&!contactGeometry.hasPhoto,contactGeometry);
  ck('Contact uses responsive two-column composition '+width,
    contactGeometry.columns===(width>740?2:1),contactGeometry);
  ck('Contact uses a branded navy panel with outlined light-on-dark fields '+width,
    contactGeometry.panel==='rgb(13, 47, 73)'&&
    contactGeometry.panelBorder==='rgba(18, 186, 175, 0.38)'&&
    contactGeometry.inputBg==='rgb(8, 38, 59)'&&
    contactGeometry.inputColour==='rgb(250, 249, 253)'&&
    contactGeometry.labelColour==='rgb(250, 249, 253)'&&
    contactGeometry.panelRadius>=17&&contactGeometry.visibleDate&&contactGeometry.visibleBudget,contactGeometry);
  ck('Contact expands the left headline and introduction '+width,
    JSON.stringify(contactGeometry.headingLines)===JSON.stringify(['Big ideas start','with a conversation.']) &&
    contactGeometry.bodyLength>=300,contactGeometry);
  ck('WhatsApp shortcut uses published business phone '+width,
    await page.locator('.view.is-current [data-contact-whatsapp]').getAttribute('href')==='https://wa.me/27682805777');

  ck('Direct email and phone are visible '+width,await page.locator('.view.is-current [data-contact-email]').getAttribute('href')==='mailto:hello@showset.co.za'&&await page.locator('.view.is-current [data-contact-phone]').getAttribute('href')?.then(x=>x.startsWith('tel:+27')));
  const fields=await page.locator('#contact-form').evaluate(form=>{
    const left=document.querySelector('.contact-left').getBoundingClientRect();
    const card=form.getBoundingClientRect();
    const btn=document.querySelector('.contact-whatsapp');
    const link=document.querySelector('[data-contact-email]');
    const whatsappSize=parseFloat(getComputedStyle(btn).fontSize);
    const emailSize=parseFloat(getComputedStyle(link).fontSize);
    return {
      required:[...form.querySelectorAll('[required]')].map(x=>x.name),
      companyVisible:form.querySelector('#company').getClientRects().length>0,
      typeVisible:form.querySelector('#project-trigger').getClientRects().length>0,
      budgetVisible:form.querySelector('#budget-trigger').getClientRects().length>0,
      disclosure:!!form.querySelector('.contact-extra'),
      note:!!form.querySelector('.form-note'),
      centreDifference:Math.abs((left.top+left.bottom)/2-(card.top+card.bottom)/2),
      whatsappSize,emailSize
    };
  });
  ck('Required Contact fields remain correct, extra fields always visible '+width,
    JSON.stringify(fields.required)===JSON.stringify(['name','email','message']) &&
    fields.companyVisible&&fields.typeVisible&&fields.budgetVisible&&!fields.disclosure&&!fields.note,fields);
  ck('Contact WhatsApp matches contact-detail type size '+width,
    Math.abs(fields.whatsappSize-fields.emailSize)<1,fields);
  if(width>740)ck('Contact copy vertically centred beside the form '+width,
    fields.centreDifference<3,fields.centreDifference);
  ck('Both dropdowns use branded panels without visible scrollbars '+width,
    await page.locator('#contact-form').evaluate(form=>
      ['#project-combobox','#budget-combobox'].every(selector=>{
        const root=form.querySelector(selector),panel=root.querySelector('.select-panel');
        return root.classList.contains('js-select-ready') &&
          getComputedStyle(panel).scrollbarWidth==='none' &&
          getComputedStyle(panel).backgroundColor==='rgb(13, 47, 73)' &&
          getComputedStyle(root.querySelector('.select-trigger')).backgroundColor==='rgb(8, 38, 59)';
      })));
  await page.locator('#contact-form button[type="submit"]').click();
  ck('Invalid Contact blocked '+width,!(await page.locator('#form-result').innerText()));
  await page.locator('#full-name').fill('SHOWSET Test');
  await page.locator('#email').fill('visitor@example.com');
  await page.locator('#message').fill('Testing a new creative project.');
  await page.locator('#project-date').fill('March 2027');
  await page.locator('#company').fill('SHOWSET Test Organisation');
  await page.locator('#budget-trigger').click();
  await page.locator('#budget-options .select-option[data-value="R50 000 – R150 000"]').click();
  ck('Budget custom dropdown syncs native form field '+width,
    await page.locator('#project-budget').inputValue()==='R50 000 – R150 000');
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
  ck('Email draft includes permanent company, type, timing and budget inputs '+width,
    draft.href?.includes('SHOWSET%20Test%20Organisation') &&
    draft.href?.includes('March%202027')&&draft.href?.includes('R50%20000')&&
    draft.href?.includes('An%20event%20or%20experience'));
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
