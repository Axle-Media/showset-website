const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3002',out=process.env.SHOWSET_ALL_CASE_EVIDENCE_DIR||'qa-results/all-cases';fs.mkdirSync(out,{recursive:true});
const seed=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/pages.json'))),cases=Object.values(seed).filter(p=>p.route.startsWith('/work/')),checks=[],errors=[];
const ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',name,detail??'')};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function scene(p,selector,f){await p.locator(selector).evaluate((e,f)=>scrollTo(0,scrollY+e.getBoundingClientRect().top+(e.offsetHeight-innerHeight)*f),f);await p.waitForTimeout(200)}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')})}
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
for(const item of cases)for(const width of[1440,1024,768,390,320]){
 const c=await b.newContext({viewport:{width,height:900}}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base+item.route);await p.waitForSelector('[data-concept-ready=true]');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(850);
 const tag=item.slug+'-'+width;
 ck('Unique authored hero '+tag,await p.locator('.case-opening-first h1').innerText().then(t=>t.replace(/\s+/g,' ').trim()===item.caseExperience.openingTitle));
 ck('Complete shared template '+tag,await p.locator('[data-case-chapter]').count()===3&&await p.locator('[data-case-gallery]').count()===1&&await p.locator('.case-partners').count()===1&&await p.locator('.case-related-card').count()===2&&await p.locator('#case-ending').count()===1);
 await shot(p,tag+'-opening');await scene(p,'[data-case-opening]',1);await p.waitForTimeout(850);ck('Approved second scene '+tag,await p.locator('.case-opening-second h2').innerText().then(t=>t.replace(/\s+/g,' ').trim()==='This is how we made it happen.'));await shot(p,tag+'-second');
 const frames=[];
 for(const[i,f]of[[0,.1],[1,.5],[2,.88],[1,.5],[0,.1]]){
  if(width>800){await scene(p,'[data-case-narrative]',f);await p.waitForTimeout(850);const m=await p.evaluate(i=>{const r=document.querySelector('.case-story-visual').getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,active:document.querySelector('[data-case-chapter="'+i+'"]').getAttribute('aria-hidden'),src:document.querySelector('[data-case-story-image="'+i+'"] img').getAttribute('src'),visible:[...document.querySelectorAll('[data-case-chapter]')].filter(e=>parseFloat(getComputedStyle(e).opacity)>.02).length}},i);frames.push(m);const ch=item.caseExperience[['brief','intention','approach'][i]];ck('Pinned matching chapter '+tag+' '+i,m.active==='false'&&m.visible===1&&m.src===(ch.image??ch.images[0])&&Math.abs(m.y)<1&&m.h===900&&Math.abs(m.x-width*.49)<1,m);
  }else{await p.locator('[data-case-chapter="'+i+'"]').scrollIntoViewIfNeeded();ck('Mobile reading order '+tag+' '+i,await p.locator('[data-case-chapter="'+i+'"]').evaluate(e=>e.querySelector('.case-chapter-photo').getBoundingClientRect().top>=e.querySelector('.case-chapter-copy').getBoundingClientRect().bottom-1&&!e.inert))}
  await shot(p,tag+'-'+['brief','intention','approach'][i]);
 }
 if(width>800)ck('Same physical frame throughout '+tag,frames.every(x=>['x','y','w','h'].every(k=>Math.abs(x[k]-frames[0][k])<1)));
 const g=p.locator('[data-case-gallery]');await g.scrollIntoViewIfNeeded();await p.mouse.move(10,10);await p.waitForTimeout(350);await shot(p,tag+'-gallery');
 ck('Independent gallery '+tag,await g.locator('[data-case-image]').count()===item.caseExperience.gallery.length&&await p.locator('.case-gallery-expand').count()===0);
 if(width===1440){let x=await g.evaluate(e=>e.scrollLeft);await p.waitForTimeout(650);ck('Slow autoplay advances '+tag,await g.evaluate(e=>e.scrollLeft)>x+5);await g.hover();x=await g.evaluate(e=>e.scrollLeft);await p.waitForTimeout(350);ck('Hover pauses autoplay '+tag,Math.abs(await g.evaluate(e=>e.scrollLeft)-x)<2);
 const control=p.locator('[data-case-gallery-motion-toggle]');await control.click();x=await g.evaluate(e=>e.scrollLeft);await p.mouse.move(10,10);await p.waitForTimeout(500);ck('Explicit Pause persists '+tag,Math.abs(await g.evaluate(e=>e.scrollLeft)-x)<2&&await control.getAttribute('aria-pressed')==='true');await control.click();await p.waitForTimeout(1600);ck('Play resumes '+tag,await g.evaluate(e=>e.scrollLeft)>x+5);await control.click();
 await g.locator('[data-case-image="0"]').click();await p.keyboard.press('ArrowLeft');ck('Lightbox previous wraps '+tag,(await p.locator('[data-case-lightbox-count]').innerText()).startsWith(String(item.caseExperience.gallery.length).padStart(2,'0')));await p.keyboard.press('ArrowRight');ck('Lightbox next wraps '+tag,(await p.locator('[data-case-lightbox-count]').innerText()).startsWith('01'));await p.keyboard.press('Escape');ck('Lightbox Escape closes '+tag,await p.locator('[data-case-lightbox]').isHidden());
 }
 for(const [name,selector]of[['companies','.case-partners'],['related','.case-related'],['cta','#case-ending']]){await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(100);await shot(p,tag+'-'+name)}
 ck('Related projects exclude self '+tag,await p.locator('.case-related-card').evaluateAll((es,route)=>es.every(e=>new URL(e.href).pathname!==route),item.route));
 ck('No overflow or broken loaded media '+tag,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.view.is-current img')].filter(e=>e.getBoundingClientRect().width&&e.complete&&!e.naturalWidth).length===0));
 if(width===390){await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(300);await g.scrollIntoViewIfNeeded();const x=await g.evaluate(e=>e.scrollLeft);await p.waitForTimeout(500);ck('Reduced motion stops autoplay and reveals chapters '+tag,Math.abs(await g.evaluate(e=>e.scrollLeft)-x)<2&&await p.locator('[data-case-chapter]').evaluateAll(es=>es.every(e=>!e.inert&&getComputedStyle(e).opacity==='1')))}
 await c.close();
}
ck('No shared gallery arrays / repeated project photography',new Set(cases.map(p=>JSON.stringify(p.caseExperience.gallery))).size===3&&new Set(cases.map(p=>p.caseExperience.openingImage)).size===3);
ck('No runtime errors',errors.length===0,errors);
}finally{await b.close();fs.writeFileSync(path.join(out,'all-cases.json'),JSON.stringify({checks,errors},null,2));if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1}})().catch(e=>{console.error(e);process.exitCode=1});
