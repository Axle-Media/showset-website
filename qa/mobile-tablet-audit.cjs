// SHOWSET mobile/tablet release audit. Check actual browser geometry of every
// public page at phone, small-tablet and landscape-tablet widths.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const widths=[320,375,390,430,600,768,820,900,1024];
const pages=[
  ['home','/'],['studio','/our-studio/'],['work','/our-work/'],
  ['events','/events-experiences/'],['creative','/creative-design/'],
  ['digital','/digital-marketing/'],['production','/content-production/'],
  ['contact','/contact/'],
  ['case-atmosphere','/work/atmosphere-is-everything/'],
  ['case-identity','/work/made-to-be-remembered/'],
  ['case-production','/work/behind-every-moment/']
];
const centered={
 home:['.manifesto .section-title','.portfolio-heading > .section-title','.services-panel-heading','.film-step.is-on h2'],
 studio:['.studio-hero-scene-first h1','.studio-outlook h2','.studio-storyboard-copy h3'],
 work:['.work-hero h1','.work-page-intro h2','.work-page-gallery .case-index-info h2'],
 events:['.service-hero h1','.service-section-head h2','.service-close .service-heading'],
 creative:['.service-hero h1','.service-section-head h2','.service-close .service-heading'],
 digital:['.service-hero h1','.service-section-head h2','.service-close .service-heading'],
 production:['.service-hero h1','.service-section-head h2','.service-close .service-heading'],
 contact:['.contact-editorial-heading','.contact-intro > p'],
 'case-atmosphere':['.case-opening-scene .case-primary-heading'],
 'case-identity':['.case-opening-scene .case-primary-heading'],
 'case-production':['.case-opening-scene .case-primary-heading']
};
const imageSelectors=[
  '.services-right','#portfolio-section .case-viewport',
  '.service-scene figure','.service-event-triptych-visuals',
  '.service-proof-image','.service-creative-artboard-image',
  '.service-production-visual','.studio-storyboard-shot',
  '.work-page-gallery .case-index-image','.case-related-photo',
  '.case-detail-visual'
];
const checks=[],warnings=[],browserErrors=[];
function ck(label,pass,detail){
  const x={label,pass:!!pass,detail};
  checks.push(x);
  console.log(pass?'PASS':'FAIL',label,typeof detail==='object'?JSON.stringify(detail):detail||'');
}
(async()=>{
  const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chromium',headless:true});
  try{
    fs.mkdirSync('qa-results/mobile-tablet',{recursive:true});
    for(const width of widths){
      const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,
        isMobile:width<=600,hasTouch:width<=600,reducedMotion:'no-preference'});
      const page=await context.newPage();
      page.on('pageerror',err=>browserErrors.push({width,error:err.message,url:page.url()}));
      for(const [name,url] of pages){
        await page.goto(base+url);
        await page.waitForSelector('[data-concept-ready=true]');
        await page.evaluate(()=>document.fonts.ready);
        const result=await page.evaluate(({selectors,imageSelectors,width})=>{
          const root=document.querySelector('.view.is-current');
          const visible=e=>{
            const st=getComputedStyle(e),r=e.getBoundingClientRect();
            return st.display!=='none'&&st.visibility!=='hidden'&&r.width>0&&r.height>0;
          };
          const text=selectors.map(selector=>{
            const nodes=[...root.querySelectorAll(selector)].filter(visible).slice(0,4);
            return {selector,items:nodes.map(n=>{
              const r=n.getBoundingClientRect(),style=getComputedStyle(n);
              return {text:n.textContent.trim().slice(0,45),align:style.textAlign,
                x:r.left,right:r.right,y:r.top,width:r.width,height:r.height,
                fontSize:parseFloat(style.fontSize)};
            })};
          });
          const images=imageSelectors.flatMap(selector=>[...root.querySelectorAll(selector)]
            .filter(visible).slice(0,6).map(el=>{
              const r=el.getBoundingClientRect();
              return {selector,height:r.height,width:r.width};
            }));
          const capabilityRules=[...root.querySelectorAll('.service-expertise .service-capability-group h3')].filter(visible).map(h=>{
            const rule=getComputedStyle(h,'::after');
            return {left:parseFloat(rule.marginLeft),right:parseFloat(rule.marginRight),
              width:parseFloat(rule.width),originX:parseFloat(rule.transformOrigin),
              content:rule.content};
          });
          const footer=document.querySelector('.footer-identity > p');
          const footerIdentity=document.querySelector('.footer-identity');
          const footerDiscover=document.querySelector('.footer-links > div:first-child');
          const footerWhat=document.querySelector('.footer-links > div:nth-child(2)');
          const footerContact=document.querySelector('.footer-contact');
          const rect=e=>{const r=e?.getBoundingClientRect();return r?
            {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}:null};
          const footerColumns={
            discoverVisible:footerDiscover?visible(footerDiscover):null,
            whatVisible:footerWhat?visible(footerWhat):null,
            contactVisible:footerContact?visible(footerContact):null,
            identity:rect(footerIdentity),what:rect(footerWhat),contact:rect(footerContact)
          };
          const contactIntro=root.querySelector('.contact-intro');
          const contactLabel=root.querySelector('.contact-form label');
          const viewport=document.documentElement.scrollWidth;
          const body=document.body.scrollWidth;
          const digitalArt=root.querySelector('.service-hero--digital .service-digital-art');
          const creativeArt=root.querySelector('.service-hero--creative .service-hero-art');
          const contactAccent=root.querySelector('.contact-editorial-heading > .accent-text');
          const contactWhatsapp=root.querySelector('.contact-whatsapp');
          const contactAccentMetrics=contactAccent?{
            height:contactAccent.getBoundingClientRect().height,
            lineHeight:parseFloat(getComputedStyle(contactAccent).lineHeight),
            font:parseFloat(getComputedStyle(contactAccent).fontSize)
          }:null;
          const mobileHeroArt={
            creative:creativeArt?.getBoundingClientRect().height??null,
            digital:digitalArt?.getBoundingClientRect().height??null,
            whatsapp:contactWhatsapp?.getBoundingClientRect().height??null,
            contactAccent:contactAccentMetrics
          };
          const contactShell=root.querySelector('.contact-shell');
          const workCard=root.querySelector('.work-page-gallery .case-index-info');
          const workMeta=root.querySelector('.work-page-gallery .work-card-meta');
          const workAction=root.querySelector('.work-page-gallery .work-feature-discover');
          const galleryHeading=root.querySelector('.case-gallery-heading-row .case-editorial-heading');
          const studioShade=root.querySelector('.studio-hero-shade');
          return {
            text,images,capabilityRules,viewport,body,windowWidth:innerWidth,rootWidth:root.getBoundingClientRect().width,
            footerWrap:footer?getComputedStyle(footer).whiteSpace:'',
            footerColumns,
            contactIntroAlign:contactIntro?getComputedStyle(contactIntro).textAlign:null,
            contactLabelAlign:contactLabel?getComputedStyle(contactLabel).textAlign:null,
            contactColumns:contactShell?getComputedStyle(contactShell).gridTemplateColumns:null,
            digitalArtPosition:digitalArt?getComputedStyle(digitalArt).position:null,
            mobileHeroArt,
            workCardHeight:workCard?workCard.getBoundingClientRect().height:null,
            workCardMinHeight:workCard?getComputedStyle(workCard).minHeight:null,
            workAlignment:workCard?{
              axis:getComputedStyle(workCard).alignItems,
              heading:getComputedStyle(workCard.querySelector('h2')).textAlign,
              meta:workMeta?getComputedStyle(workMeta).justifyContent:null,
              action:workAction?getComputedStyle(workAction).alignSelf:null
            }:null,
            galleryHeadingAlign:galleryHeading?getComputedStyle(galleryHeading).textAlign:null,
            studioShade:studioShade?getComputedStyle(studioShade).backgroundImage:null
          };
        },{selectors:centered[name]||[],imageSelectors,width});
        const tag=name+' @'+width;
        ck('No viewport-wide horizontal overflow: '+tag,
          result.viewport<=width+3&&result.body<=width+3,
          {document:result.viewport,body:result.body,width});
        if(width<=600){
          const found=result.text.flatMap(g=>g.items.map(n=>({selector:g.selector,...n})));
          ck('Mobile editorial copy centre-aligned: '+tag,
            found.length>0&&found.every(n=>n.align==='center'),found.filter(n=>n.align!=='center'));
          ck('Footer sign-off wraps safely: '+tag,result.footerWrap==='normal',
            result.footerWrap);
          const foot=result.footerColumns;
          ck('Mobile Discover hidden, service and Contact columns share row: '+tag,
            foot.discoverVisible===false&&foot.whatVisible&&foot.contactVisible
            &&foot.what&&foot.contact&&foot.identity
            &&Math.abs(foot.what.top-foot.contact.top)<=3
            &&foot.what.right<=foot.contact.left+2
            &&foot.identity.bottom<=foot.what.top,
            foot);
          if(['events','creative','digital','production'].includes(name)){
            ck('Mobile service-card accent rules centred below headings: '+tag,
              result.capabilityRules.length>0&&result.capabilityRules.every(rule=>
                Number.isFinite(rule.left)&&Number.isFinite(rule.right)
                &&Math.abs(rule.left-rule.right)<=2
                &&Math.abs(rule.originX-rule.width/2)<=1),result.capabilityRules);
          }
          if(name==='contact'){
            ck('Contact details centred; form labels still left-aligned: '+tag,
              result.contactIntroAlign==='center'&&result.contactLabelAlign==='left',result);
            if(width<=370){
              const m=result.mobileHeroArt;
              ck('Narrow phone Contact headline accent stays on one line: '+tag,
                !!m.contactAccent&&m.contactAccent.lineHeight>0
                &&m.contactAccent.height<=m.contactAccent.lineHeight*1.25,
                m.contactAccent);
              ck('Narrow phone WhatsApp CTA text does not wrap: '+tag,
                m.whatsapp>0&&m.whatsapp<=65,m.whatsapp);
            }
          }
          if(width<=430&&name==='creative'){
            ck('Mobile Creative art remains compact and visible: '+tag,
              result.mobileHeroArt.creative>=160
              &&result.mobileHeroArt.creative<=216,result.mobileHeroArt.creative);
          }
          if(width<=430&&name==='digital'){
            ck('Mobile Digital illustration leaves space for the heading: '+tag,
              result.mobileHeroArt.digital>=180
              &&result.mobileHeroArt.digital<=216,result.mobileHeroArt.digital);
          }
        }
        if(width>=768){
          ck('Tablet and desktop footer Discover remains visible: '+tag,
            result.footerColumns.discoverVisible===true,result.footerColumns);
        }
        if(width<=600&&name==='work'){
          ck('Mobile Work cards use centred title, metadata and action: '+tag,
            result.workAlignment?.axis==='center'
            &&result.workAlignment?.heading==='center'
            &&result.workAlignment?.meta==='center'
            &&result.workAlignment?.action==='center',
            result.workAlignment);
        }
        if(width<=600&&name.startsWith('case-')){
          ck('Mobile case gallery heading centred: '+tag,
            result.galleryHeadingAlign==='center',result.galleryHeadingAlign);
        }
        if(width>=768&&width<=900&&name==='studio'){
          ck('Studio tablet photograph has legibility shade: '+tag,
            result.studioShade?.includes('0.8)'),result.studioShade?.slice(0,200));
        }
        if(width>=768&&width<=900&&name==='contact'){
          ck('Contact stacks rather than squeezing tablet form: '+tag,
            result.contactColumns?.split(' ').length===1,result.contactColumns);
        }
        if(width>=768&&width<=900&&name==='digital'){
          ck('Digital art stacks cleanly on narrow tablets: '+tag,
            result.digitalArtPosition==='relative',result.digitalArtPosition);
        }
        const maxImageHeight=width<=600?540:width<=900?610:760;
        // The homepage desktop/tablet service image is intentionally a
        // viewport-height, sticky half-panel. Exclude that cinematic frame.
        const excessive=result.images.filter(im=>
          !(width>900&&im.selector==='.services-right')&&im.height>maxImageHeight);
        ck('No overly tall portfolio or service image frames: '+tag,
          excessive.length===0,excessive);
        if(name==='work'&&width<=600){
          ck('Work card has no fixed minimum empty padding: '+tag,
            result.workCardMinHeight===null||
            (parseFloat(result.workCardMinHeight)===0&&result.workCardHeight>65),
            {height:result.workCardHeight,minHeight:result.workCardMinHeight});
        }
        if(width===390||width===768){
          // Viewport screenshot per route plus a content section on the key pages.
          await page.screenshot({path:'qa-results/mobile-tablet/'+name+'-'+width+'.png',
            animations:'disabled'});
          if(name==='home'){
            await page.locator('.footer-head').screenshot({
              path:'qa-results/mobile-tablet/footer-'+width+'.png',animations:'disabled'});
          }
          const selector={
            home:'#portfolio-section',studio:'.studio-exploration-storyboard',
            work:'.work-page-gallery',events:'.service-story--events',
            creative:'.service-story--creative',digital:'.service-hero--digital',
            production:'.service-production-composition',contact:'.contact-shell'
          }[name];
          if(selector){
            const el=page.locator('.view.is-current '+selector).first();
            if(await el.count()){
              await el.screenshot({path:'qa-results/mobile-tablet/'+name+'-section-'+width+'.png',
                animations:'disabled',timeout:25000}).catch(e=>
                warnings.push({name,width,selector,message:e.message.slice(0,160)}));
            }
          }
        }
      }
      if(width<=600){
        await page.goto(base+'/');
        await page.waitForSelector('[data-concept-ready=true]');
        const button=page.locator('.mobile-toggle');
        if(await button.isVisible()){
          await button.click();
          const expanded=await button.getAttribute('aria-expanded');
          const accessible=await page.locator('.mobile-panel.open nav a').count();
          ck('Mobile menu opens with accessible navigation @'+width,expanded==='true'&&accessible>=5,
            {expanded,links:accessible});
          ck('Mobile menu does not overflow viewport @'+width,
            await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
          await button.click();
        }
      }
      await context.close();
    }
    ck('No JavaScript page errors',browserErrors.length===0,browserErrors.slice(0,20));
  }finally{
    await browser.close();
    fs.writeFileSync('qa-results/mobile-tablet-audit.json',JSON.stringify({
      counts:{passed:checks.filter(x=>x.pass).length,failed:checks.filter(x=>!x.pass).length},
      checks,warnings,browserErrors},null,2));
    if(checks.some(x=>!x.pass)||browserErrors.length)process.exitCode=1;
  }
})().catch(e=>{console.error(e);process.exitCode=1});
