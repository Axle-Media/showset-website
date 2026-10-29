const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs');const checks=[],errors=[];const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name)};
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const context=await browser.newContext({viewport:{width:1600,height:1000}});
 await context.addInitScript(()=>{
  window.__resources={intervals:new Set(),observers:new Set()};
  const si=window.setInterval,ci=window.clearInterval,IO=window.IntersectionObserver;
  window.setInterval=(fn,ms,...args)=>{const id=si(fn,ms,...args);window.__resources.intervals.add(id);return id};
  window.clearInterval=id=>{window.__resources.intervals.delete(id);return ci(id)};
  window.IntersectionObserver=class extends IO{constructor(...args){super(...args);window.__resources.observers.add(this)}disconnect(){window.__resources.observers.delete(this);super.disconnect()}};
  addEventListener('message',e=>{if(e.data?.type==='showset-studio-state')window.__state=e.data});
 });
 const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3002')+'/studio/');await p.waitForSelector('.studio-layer');
 await p.frameLocator('iframe').locator('[data-concept-ready=true]').waitFor();
 const f=p.frames().find(f=>f.url().includes('/studio-preview/'));await f.waitForFunction(()=>window.__state&&document.querySelector('[data-concept-ready=true]'));
 await f.evaluate(()=>window.__hero=document.querySelector('.hero-title'));
 await p.locator('.studio-layer').first().click();await p.getByLabel('Headline',{exact:true}).fill('A stable editable idea.');await p.waitForTimeout(200);
 check('Studio text edit retains the heading node',await f.evaluate(()=>window.__hero===document.querySelector('.hero-title')));
 check('Edited content renders', (await f.locator('.hero-title').innerText()).includes('A stable editable idea.'));
 await p.getByRole('button',{name:'Preview motion',exact:true}).click();await p.waitForTimeout(250);
 check('Motion toggle retains scene nodes',await f.evaluate(()=>window.__hero===document.querySelector('.hero-title')));
 await f.locator('#film-track').evaluate(e=>scrollTo(0,e.offsetTop+(e.offsetHeight-innerHeight)*.52));await p.waitForTimeout(1000);
 const before=await f.evaluate(()=>{window.__film=document.querySelector('[data-film-step="1"]');return {y:scrollY,chapter:document.querySelector('[data-film-step].is-on')?.dataset.filmStep,intervals:window.__resources.intervals.size,observers:window.__resources.observers.size,originals:document.querySelectorAll('#case-rail>[data-case-slide]').length,clones:document.querySelectorAll('#case-rail>a').length}});
 // Exercise the actual same-origin Studio state protocol with the last real editor payload.
 async function update(change){await p.evaluate(change=>{const frame=document.querySelector('iframe'),w=frame.contentWindow,d=structuredClone(w.__state);const home=d.catalog.home;const story=home.sections.find(s=>s.type==='story');story.items[1].title=change;d.page=home;frame.contentWindow.postMessage(d,location.origin)},change);await p.waitForTimeout(80)}
 for(let i=0;i<16;i++)await update('Edited second act '+i+'.');
 const after=await f.evaluate(()=>({y:scrollY,chapter:document.querySelector('[data-film-step].is-on')?.dataset.filmStep,same:window.__film===document.querySelector('[data-film-step="1"]'),revealed:document.querySelector('[data-film-step="1"] .wipe-heading').classList.contains('is-revealed'),intervals:window.__resources.intervals.size,observers:window.__resources.observers.size,clones:document.querySelectorAll('#case-rail>a').length}));
 check('Active scroll chapter survives repeated edits',before.chapter===after.chapter&&after.chapter==='1',{before,after});
 check('Scroll position and story node survive repeated edits',Math.abs(before.y-after.y)<2&&after.same,after);
 check('Circular reveal remains revealed during content updates',after.revealed);
 check('Carousel refresh retains bounded idle timers',before.intervals===after.intervals&&after.intervals<=1,after);
 check('Reveal observers stay bounded',after.observers===before.observers,after);
 check('Carousel clones stay bounded',after.clones===before.clones&&after.clones===before.originals*3,{before,after});
 await f.locator('#portfolio-section').evaluate(e=>e.scrollIntoView());await p.waitForTimeout(350);await f.locator('#case-carousel').focus();await f.locator('#case-carousel').press('ArrowRight');await p.waitForTimeout(1100);
 const rail=await f.locator('#case-rail').evaluate(e=>{window.__rail=e;return e.style.transform});await update('After carousel edit.');
 check('Carousel position and node survive content edits',await f.locator('#case-rail').evaluate((e,rail)=>e===window.__rail&&e.style.transform===rail,rail));
 await f.locator('[data-service="2"]').focus();await update('After focus edit.');
 check('Focused service stays focused',await f.evaluate(()=>document.activeElement?.getAttribute('data-service')==='2'));
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(200);check('OS motion change retains scene identity',await f.evaluate(()=>window.__film===document.querySelector('[data-film-step="1"]')));
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.evaluate(()=>{const w=document.querySelector('iframe').contentWindow,d=structuredClone(w.__state);d.page=d.catalog.contact;d.previewMotion=true;w.postMessage(d,location.origin)});
 await f.waitForFunction(()=>document.querySelector('[data-concept-route=contact]'));
 await f.locator('#full-name').fill('Local lifecycle test');await f.locator('#email').fill('test@example.com');await f.locator('#message').fill('Local only');
 await f.locator('#project-trigger').press('ArrowDown');await f.waitForFunction(()=>document.activeElement.matches('.select-option'));await f.locator('#project-combobox').press('End');await f.waitForTimeout(40);await f.locator('#project-combobox').press('Enter');
 const chosen=await f.locator('#project-trigger .select-value').innerText();await f.locator('#contact-form button[type=submit]').click();const feedbackBefore=await f.locator('#form-result').innerText();await f.locator('#full-name').focus();
 await f.locator('#full-name').evaluate(e=>{window.__field=e;e.setSelectionRange(3,7)});
 for(let i=0;i<4;i++){await p.evaluate(i=>{const w=document.querySelector('iframe').contentWindow,d=structuredClone(w.__state);d.page.sections[0].headline='Contact editing '+i+'.';w.postMessage(d,location.origin)},i);await p.waitForTimeout(80)}
 check('Contact input node, focus and caret survive content updates',await f.locator('#full-name').evaluate(e=>e===window.__field&&e===document.activeElement&&e.selectionStart===3&&e.selectionEnd===7&&e.value==='Local lifecycle test'));
 check('Selected project label survives content updates',await f.locator('#project-trigger .select-value').innerText()===chosen&&chosen==='Not quite sure yet',{chosen,after:await f.locator('#project-trigger .select-value').innerText(),value:await f.locator('#project-type').inputValue()});
 check('Preview form feedback survives content updates',!!feedbackBefore&&(await f.locator('#form-result').innerText())===feedbackBefore,{feedbackBefore,after:await f.locator('#form-result').innerText()});
 check('No runtime errors',!errors.length,errors);
 }finally{await browser.close();fs.mkdirSync('qa-results',{recursive:true});fs.writeFileSync('qa-results/lifecycle.json',JSON.stringify({checks,errors},null,2));if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;}})().catch(e=>{console.error(e);process.exitCode=1});
