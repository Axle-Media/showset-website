// Browser audit of every public SHOWSET page's mobile editorial axis.
// Navigation, filter controls and contact form fields intentionally stay functional.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const pages=[
 ['Home','/', ['.manifesto-heading-group h2','.portfolio-heading h2','.dot-words h2','#ending h2']],
 ['Our Studio','/our-studio/', ['.studio-hero-scene-first h1','.studio-outlook h2','.studio-storyboard-copy h3','.studio-final h2']],
 ['Our Work','/our-work/', ['.work-hero h1','.case-index-info h2','.work-final h2']],
 ['Events','/events-experiences/', ['.service-hero h1','.service-close .service-heading']],
 ['Creative','/creative-design/', ['.service-hero h1','.service-close .service-heading']],
 ['Digital','/digital-marketing/', ['.service-hero h1','.service-close .service-heading']],
 ['Production','/content-production/', ['.service-hero h1','.service-close .service-heading']],
 ['Contact','/contact/', ['.contact-editorial-heading','.contact-intro > p']],
 ['Amaze-Ball','/work/the-amaze-ball/', ['.case-opening-first h1','.case-chapter-copy h2','.case-related-heading h2','.case-related-card-caption h3']],
 ['Elmboog','/work/made-to-be-remembered/', ['.case-opening-first h1','.case-chapter-copy h2','.case-related-heading h2','.case-related-card-caption h3']],
 ['ProVault','/work/provault/', ['.case-opening-first h1','.case-chapter-copy h2','.case-related-heading h2','.case-related-card-caption h3']],
 ['Privacy','/privacy-policy/', ['.legal-title','.legal-summary','.legal-section h2']],
 ['Terms','/terms-and-conditions/', ['.legal-title','.legal-summary','.legal-section h2']]
];
const results=[],errors=[];
function ck(label,pass,detail){results.push({label,pass:!!pass,detail});console.log(pass?'PASS':'FAIL',label,detail??'');}
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push({url:page.url(),error:e.message}));
  for(const width of [320,390,600]){
   await page.setViewportSize({width,height:900});
   for(const [name,route,selectors] of pages){
    await page.goto(base+route);
    if(!['Privacy','Terms'].includes(name)){
      await page.waitForSelector('.concept-12-root[data-concept-ready="true"]');
    }else await page.waitForSelector('.legal-main');
    await page.evaluate(()=>document.fonts.ready);
    const data=await page.evaluate(selectors=>{
      const main=document.querySelector('.view.is-current')||document.querySelector('.legal-main');
      const visible=e=>{const st=getComputedStyle(e),r=e.getBoundingClientRect();
        return st.display!=='none'&&st.visibility!=='hidden'&&r.width>0&&r.height>0;};
      const selected=selectors.map(selector=>({
        selector,items:[...(main?.querySelectorAll(selector)||[])].filter(visible).slice(0,5)
          .map(el=>({text:el.textContent.trim().slice(0,35),align:getComputedStyle(el).textAlign}))
      }));
      const rect=e=>{const r=e?.getBoundingClientRect();return r&&{mid:r.x+r.width/2,width:r.width}};
      const related=main?.querySelector('.case-related-heading');
      const relatedButton=related?.querySelector('.understated-link');
      const relatedHeading=related?.querySelector('h2');
      const submit=main?.querySelector('.contact-submit-row');
      const close=main?.querySelector('.service-close--editorial .end-link');
      const pageEnd=main?.querySelector('#ending .end-link,#case-ending .end-link,.studio-final .editorial-action,.work-final .editorial-action');
      const centerDiff=(a,b)=>{const x=rect(a),y=rect(b);return x&&y?Math.abs(x.mid-y.mid):null};
      return {
        selected,
        width:document.documentElement.scrollWidth,
        relatedGap:centerDiff(relatedButton,related),
        relatedTitleGap:centerDiff(relatedHeading,related),
        submitAlign:submit&&getComputedStyle(submit).justifyContent,
        endGap:centerDiff(pageEnd,pageEnd?.parentElement),
        closeGap:centerDiff(close,close?.parentElement),
        fieldAlign:main?.querySelector('.contact-form label')&&getComputedStyle(main.querySelector('.contact-form label')).textAlign
      };
    },selectors);
    const tag=name+' @'+width;
    ck('Every page contains matching mobile editorial selectors '+tag,
      data.selected.some(x=>x.items.length>0),data.selected.map(x=>({selector:x.selector,count:x.items.length})));
    const bad=data.selected.flatMap(x=>x.items.filter(i=>i.align!=='center').map(i=>({selector:x.selector,...i})));
    ck('Mobile editorial headings and paragraphs centred '+tag,bad.length===0,bad);
    ck('No horizontal overflow '+tag,data.width<=width+3,{document:data.width,viewport:width});
    if(route.startsWith('/work/')){
      ck('Related heading and link centred '+tag,data.relatedGap!==null&&data.relatedGap<=3&&data.relatedTitleGap<=3,
        {cta:data.relatedGap,heading:data.relatedTitleGap});
    }
    if(name==='Contact'){
      ck('Contact submit CTA centred '+tag,data.submitAlign==='center',data.submitAlign);
      ck('Contact form labels remain readable '+tag,data.fieldAlign==='left',data.fieldAlign);
    }
    if(data.endGap!==null){
      ck('Final CTA button centred '+tag,data.endGap<=3,{offset:data.endGap});
    }
    if(data.closeGap!==null){
      ck('Service closing CTA centred '+tag,data.closeGap<=3,{offset:data.closeGap});
    }
   }
  }
  ck('No unhandled errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/mobile-centre-alignment.json',JSON.stringify({results,errors},null,2));
  if(results.some(x=>!x.pass)||errors.length)process.exitCode=1;
 }
})().catch(e=>{console.error(e);process.exitCode=1});
