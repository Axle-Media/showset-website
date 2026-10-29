// Website-wide headline colour contract. Check actual rendered lines on desktop
// and mobile: ivory first, teal second, ivory terminal punctuation except the
// intentionally turquoise pre-dot homepage story punctuation. The revealed
// version switches to white punctuation against the turquoise circle.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const slugs=['','our-studio','our-work','events-experiences','creative-design','digital-marketing','content-production','contact','work/atmosphere-is-everything','work/made-to-be-remembered','work/behind-every-moment'];
const checks=[],errors=[];
const ck=(name,pass,details)=>{checks.push({name,pass:!!pass,details});console.log(pass?'PASS':'FAIL',name,details??'')};
(async()=>{
 const b=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  for(const width of[1440,390]){
   const c=await b.newContext({viewport:{width,height:900}});
   const p=await c.newPage();
   p.on('pageerror',e=>errors.push(e.message));
   for(const slug of slugs){
    const route='/'+(slug?slug+'/':'');
    await p.goto(base+route);
    await p.waitForSelector('[data-concept-ready=true]');
    await p.evaluate(()=>document.fonts.ready);
    const result=await p.locator('.view.is-current :is(h1,h2,h3)').evaluateAll(headings=>headings.map(h=>{
     const text=h.textContent.trim();
     const lines=[...h.querySelectorAll(':scope > .wipe-line, :scope > .plain-line, :scope > .line, :scope > .case-heading-line')];
     const expectedPeriod=/[.!?]$/.test(text);
     const last= h.querySelector('.showset-ending-punctuation:last-child, .service-period:last-child, .hero-period:last-child, .teal-dot:last-child, .service-capability-period:last-child, .case-heading-period:last-child, .headline-period:last-child');
     const terminals=[...h.querySelectorAll('.showset-ending-punctuation,.service-period,.hero-period,.teal-dot,.service-capability-period,.case-heading-period,.headline-period')];
     const terminal=terminals.at(-1);
     const two=h.dataset.showsetMultiline==='true'||lines.length>=2;
     const plain=!lines.length;
     const isCase=h.hasAttribute('data-case-heading');
     const isDot=h.closest('.dot-words')!==null;
     const isRevealedDot=h.closest('.dot-colour-reveal')!==null;
     const accentLine=lines.length>1?lines.at(-1):null;
     // Editorial CTAs put text directly in .plain-line and only their punctuation in a child span.
     // Reading firstElementChild in those cases samples the ivory period, not the teal wording.
     const accentTarget=accentLine?.matches('.plain-line')?accentLine:(accentLine?.firstElementChild||accentLine);
     const naturalTarget=lines.length===1?lines[0].firstElementChild:h;
     const colour=x=>x?getComputedStyle(x).color:null;
     return {text:text.slice(0,85),two,plain,isCase,isDot,isRevealedDot,expectedPeriod,terminal:terminal?.textContent||'',terminalColour:colour(terminal),baseColour:colour(naturalTarget),firstLineColour:getComputedStyle(naturalTarget,'::first-line').color,accentColour:colour(accentTarget),explicit:lines.length>=2};
    }));
    const two=result.filter(x=>x.two);
    ck('Headings with intentional second lines have teal text '+route+' '+width,
      two.filter(x=>x.explicit).every(x=>x.accentColour==='rgb(18, 186, 175)'||x.isCase),two.filter(x=>x.explicit));
    ck('Wrapped headings retain teal lower-line base '+route+' '+width,
      two.filter(x=>!x.explicit&&!x.isCase).every(x=>x.baseColour==='rgb(18, 186, 175)'),two.filter(x=>!x.explicit&&!x.isCase));
    ck('Two-line terminal punctuation follows approved colours '+route+' '+width,
      two.filter(x=>x.expectedPeriod).every(x=>x.terminalColour===
        (x.isDot&&!x.isRevealedDot?'rgb(18, 186, 175)':'rgb(250, 249, 253)')),two.filter(x=>x.expectedPeriod));
    ck('No horizontal headline overflow '+route+' '+width,
      await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
   await c.close();
  }
  ck('No heading script errors',errors.length===0,errors);
 }finally{
  await b.close();fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/heading-accent-lines.json',JSON.stringify({checks,errors},null,2));
  if(checks.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
