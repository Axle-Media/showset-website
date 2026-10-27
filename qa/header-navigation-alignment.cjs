// Browser acceptance for shared header geometry, direct service routing
// and aligned homepage editorial headline. Hero position is intentionally unchanged.
const {chromium}=require(process.env.SHOWSET_PLAYWRIGHT_MODULE||'playwright');
const fs=require('node:fs');
const base=process.env.SHOWSET_BASE_URL||'http://127.0.0.1:3001';
const checks=[];
function ck(name,pass,details){checks.push({name,pass:!!pass,details});console.log(pass?'PASS':'FAIL',name,details||'')}
const servicePaths=['/events-experiences/','/creative-design/','/digital-marketing/','/content-production/'];
(async()=>{
 const browser=await chromium.launch({channel:process.env.SHOWSET_PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:950}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/');
  await page.waitForSelector('[data-concept-ready="true"]');
  ck('Legacy What we do dropdown removed',await page.locator('#nav-dropdown,#services-button,#nav-panel').count()===0);
  const links=await page.locator('.desktop-navigation > a.nav-text').evaluateAll(els=>els.map(a=>new URL(a.href).pathname));
  ck('Four services are direct, first-class nav links',links.slice(0,4).join('|')===servicePaths.join('|'),links);
  ck('Studio, Work and Contact follow service pages',links.slice(4).join('|')==='/our-studio/|/our-work/|/contact/',links);
  const manifestTitle=await page.locator('#discover .manifesto-heading-group h2').innerText();
  ck('Editorial heading copy retained',manifestTitle.replace(/\\s+/g,' ').trim()==='Too good to leave on the drawing board.',manifestTitle);
  ck('Hero heading copy retained',(await page.locator('.hero-title').innerText()).replace(/\\s+/g,' ').trim()==='Great ideas move people.');

  for(const width of [1920,1600,1440,1366,1351,1350,1100,851,600,390]){
   await page.setViewportSize({width,height:920});
   await page.waitForTimeout(125);
   const layout=await page.evaluate(()=>{
     const rect=selector=>{const node=document.querySelector(selector);if(!node)return null;const r=node.getBoundingClientRect(),style=getComputedStyle(node);return {x:r.left,right:r.right,width:r.width,visible:style.display!=='none'&&style.visibility!=='hidden'}};
     const nav=rect('.desktop-navigation'),cta=rect('#site-header .header-cta'),logo=rect('#site-header .brand'),
       manifesto=rect('#discover .manifesto-heading-group h2'),portfolio=rect('#portfolio-section .portfolio-heading > .section-title'),
       mobile=rect('#mobile-toggle');
     const navEnds=[...document.querySelectorAll('.desktop-navigation > a')].map(a=>a.getBoundingClientRect());
     return {w:innerWidth,logo,cta,nav,mobile,manifesto,portfolio,navFirst:navEnds[0]?.left,navLast:navEnds.at(-1)?.right,documentWidth:document.documentElement.scrollWidth};
   });
   const eps=1.25;
   ck('Logo and manifesto share left gutter '+width,Math.abs(layout.logo.x-layout.manifesto.x)<=eps,layout);
   ck('Manifesto aligns with Work heading '+width,Math.abs(layout.manifesto.x-layout.portfolio.x)<=eps,{manifesto:layout.manifesto,portfolio:layout.portfolio});
   ck('Header fits viewport '+width,layout.documentWidth<=width+2,{documentWidth:layout.documentWidth,width});
   if(width>=1351){
     ck('Direct links and right-hand CTA visible '+width,layout.nav.visible&&layout.cta.visible&&!layout.mobile.visible);
     ck('Logo and CTA match outer-edge spacing '+width,Math.abs(layout.logo.x-(width-layout.cta.right))<=eps,{left:layout.logo.x,right:width-layout.cta.right});
     ck('Navigation has no overlap '+width,layout.logo.right+8<layout.navFirst&&layout.navLast+8<layout.cta.x,{logo:layout.logo,cta:layout.cta,navFirst:layout.navFirst,navLast:layout.navLast});
   }else{
     ck('Responsive service navigation uses mobile menu '+width,!layout.nav.visible&&!layout.cta.visible&&layout.mobile.visible);
   }
  }
  await page.setViewportSize({width:390,height:844});
  fs.mkdirSync('qa-results',{recursive:true});
  await page.screenshot({path:'qa-results/header-mobile.png',animations:'disabled'});
  await page.getByRole('button',{name:'Open menu'}).click();
  ck('Mobile menu opens and exposes four service pages',
    await page.locator('#mobile-panel').getAttribute('aria-hidden')==='false'&&
    (await page.locator('#mobile-panel nav > a').evaluateAll(els=>els.map(el=>new URL(el.href).pathname).slice(1,5))).join('|')===servicePaths.join('|'));
  await page.locator('#mobile-panel nav a[href="/creative-design/"]').click();
  await page.waitForURL(url=>url.pathname==='/creative-design/');
  ck('Mobile service link navigates to service page',new URL(page.url()).pathname==='/creative-design/');
  await page.setViewportSize({width:1440,height:920});
  await page.screenshot({path:'qa-results/header-desktop.png',animations:'disabled'});
  await page.locator('.desktop-navigation a[href="/digital-marketing/"]').click();
  await page.waitForURL(url=>url.pathname==='/digital-marketing/');
  ck('Desktop direct service link navigates to service page',new URL(page.url()).pathname==='/digital-marketing/');
  ck('No browser errors',errors.length===0,errors);
 }finally{
  await browser.close();
  fs.mkdirSync('qa-results',{recursive:true});
  fs.writeFileSync('qa-results/header-navigation-alignment.json',JSON.stringify(checks,null,2));
  if(checks.some(x=>!x.pass))process.exitCode=1;
 }
})().catch(error=>{console.error(error);process.exitCode=1});
